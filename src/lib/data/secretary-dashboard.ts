/**
 * Tổng quan cho Bảng điều khiển Bí thư (server-only, qua RLS).
 * Chỉ ĐỌC dữ liệu tổng hợp; không ghi. Attendance chỉ đọc tỉ lệ nếu đã có dữ liệu.
 */
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Tables } from "@/lib/types";

export interface SecretaryOverview {
  totalStudents: number;
  activeStudents: number;
  upcomingSessions: Tables<"activity_sessions">[];
  pendingLeaveCount: number;
  attendanceRateThisMonth: number | null;
}

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

function monthStartISO(): string {
  const d = new Date();
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-01`;
}

export async function getSecretaryOverview(): Promise<SecretaryOverview> {
  const supabase = await createSupabaseServerClient();

  // Học sinh trong phạm vi (RLS giới hạn theo Khu phố phụ trách).
  const [{ count: totalStudents }, { count: activeStudents }] = await Promise.all([
    supabase
      .from("students")
      .select("id", { count: "exact", head: true })
      .is("deleted_at", null),
    supabase
      .from("students")
      .select("id", { count: "exact", head: true })
      .is("deleted_at", null)
      .eq("active", true),
  ]);

  // Buổi sinh hoạt sắp tới (từ hôm nay), tối đa 5.
  const { data: upcoming } = await supabase
    .from("activity_sessions")
    .select("*")
    .is("deleted_at", null)
    .gte("session_date", todayISO())
    .order("session_date")
    .limit(5);

  // Đơn xin nghỉ chờ xử lý.
  const { count: pendingLeaveCount } = await supabase
    .from("leave_requests")
    .select("id", { count: "exact", head: true })
    .eq("status", "SUBMITTED");

  // Tỉ lệ điểm danh tháng này (nếu có bản ghi).
  const { data: att } = await supabase
    .from("attendance_records")
    .select("status, marked_at")
    .gte("marked_at", monthStartISO());

  let attendanceRateThisMonth: number | null = null;
  if (att && att.length > 0) {
    const present = att.filter((a) => a.status === "PRESENT").length;
    attendanceRateThisMonth = Math.round((present / att.length) * 100);
  }

  return {
    totalStudents: totalStudents ?? 0,
    activeStudents: activeStudents ?? 0,
    upcomingSessions: upcoming ?? [],
    pendingLeaveCount: pendingLeaveCount ?? 0,
    attendanceRateThisMonth,
  };
}
