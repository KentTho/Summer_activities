/**
 * Tổng quan cho Bảng điều khiển Bí thư (server-only, qua RLS).
 * Chỉ ĐỌC dữ liệu tổng hợp trong phạm vi Khu phố phụ trách (RLS tự giới hạn).
 */
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Tables } from "@/lib/types";

export interface SecretaryOverview {
  totalStudents: number;
  activeStudents: number;
  todaySessions: Tables<"activity_sessions">[];
  upcomingSessions: Tables<"activity_sessions">[];
  pendingLeaveCount: number;
  toMarkToday: number;
  monthPresent: number;
  monthExcused: number;
  monthUnexcused: number;
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
  const today = todayISO();

  const [{ count: totalStudents }, { count: activeStudents }] = await Promise.all([
    supabase.from("students").select("id", { count: "exact", head: true }).is("deleted_at", null),
    supabase
      .from("students")
      .select("id", { count: "exact", head: true })
      .is("deleted_at", null)
      .eq("active", true),
  ]);

  // Buổi từ hôm nay trở đi (tách "hôm nay" và "sắp tới").
  const { data: fromToday } = await supabase
    .from("activity_sessions")
    .select("*")
    .is("deleted_at", null)
    .gte("session_date", today)
    .order("session_date")
    .limit(20);
  const todaySessions = (fromToday ?? []).filter((s) => s.session_date === today);
  const upcomingSessions = (fromToday ?? []).filter((s) => s.session_date > today).slice(0, 5);

  // Số học sinh còn phải điểm danh cho các buổi hôm nay đang mở.
  let toMarkToday = 0;
  const openTodayIds = todaySessions.filter((s) => !s.closed_at).map((s) => s.id);
  for (const sessionId of openTodayIds) {
    const { data: snb } = await supabase
      .from("session_neighborhoods")
      .select("neighborhood_id")
      .eq("session_id", sessionId);
    const nIds = (snb ?? []).map((r) => r.neighborhood_id);
    if (nIds.length === 0) continue;
    const [{ count: rosterCount }, { count: markedCount }] = await Promise.all([
      supabase
        .from("students")
        .select("id", { count: "exact", head: true })
        .in("neighborhood_id", nIds)
        .is("deleted_at", null)
        .eq("active", true),
      supabase
        .from("attendance_records")
        .select("id", { count: "exact", head: true })
        .eq("session_id", sessionId),
    ]);
    toMarkToday += Math.max(0, (rosterCount ?? 0) - (markedCount ?? 0));
  }

  const { count: pendingLeaveCount } = await supabase
    .from("leave_requests")
    .select("id", { count: "exact", head: true })
    .eq("status", "SUBMITTED");

  // Điểm danh tháng này.
  const { data: att } = await supabase
    .from("attendance_records")
    .select("status, marked_at")
    .gte("marked_at", monthStartISO());

  let monthPresent = 0;
  let monthExcused = 0;
  let monthUnexcused = 0;
  for (const a of att ?? []) {
    if (a.status === "PRESENT") monthPresent += 1;
    else if (a.status === "EXCUSED") monthExcused += 1;
    else if (a.status === "UNEXCUSED") monthUnexcused += 1;
  }
  const monthTotal = monthPresent + monthExcused + monthUnexcused;
  const attendanceRateThisMonth =
    monthTotal > 0 ? Math.round((monthPresent / monthTotal) * 100) : null;

  return {
    totalStudents: totalStudents ?? 0,
    activeStudents: activeStudents ?? 0,
    todaySessions,
    upcomingSessions,
    pendingLeaveCount: pendingLeaveCount ?? 0,
    toMarkToday,
    monthPresent,
    monthExcused,
    monthUnexcused,
    attendanceRateThisMonth,
  };
}
