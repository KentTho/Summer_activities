/**
 * Data-access cổng Phụ huynh/Học sinh (server-only, qua RLS).
 * RLS (is_guardian_of) đảm bảo chỉ thấy dữ liệu của học sinh liên kết với mình.
 */
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { AttendanceStatus } from "@/modules/attendance/domain/attendance-status";

export interface ChildOption {
  id: string;
  fullName: string;
}

/** Danh sách con (học sinh liên kết) — để chọn khi gửi đơn xin nghỉ. */
export async function listParentChildren(): Promise<ChildOption[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("students")
    .select("id, full_name")
    .is("deleted_at", null)
    .order("full_name");
  if (error) throw error;
  return (data ?? []).map((s) => ({ id: s.id, fullName: s.full_name }));
}

export interface ParentAttendanceItem {
  sessionTitle: string;
  sessionDate: string;
  status: AttendanceStatus;
  studentName: string;
}

/** Lịch sử điểm danh của các con (RLS chỉ trả bản ghi của con mình). */
export async function listParentAttendance(): Promise<ParentAttendanceItem[]> {
  const supabase = await createSupabaseServerClient();
  const { data: recs, error } = await supabase
    .from("attendance_records")
    .select("status, marked_at, session_id, student_id")
    .order("marked_at", { ascending: false })
    .limit(100);
  if (error) throw error;
  if (!recs || recs.length === 0) return [];

  const sessionIds = [...new Set(recs.map((r) => r.session_id))];
  const studentIds = [...new Set(recs.map((r) => r.student_id))];

  const [{ data: sessions }, { data: students }] = await Promise.all([
    supabase.from("activity_sessions").select("id, title, session_date").in("id", sessionIds),
    supabase.from("students").select("id, full_name").in("id", studentIds),
  ]);
  const sessionById = new Map((sessions ?? []).map((s) => [s.id, s]));
  const studentName = new Map((students ?? []).map((s) => [s.id, s.full_name]));

  return recs.map((r) => {
    const s = sessionById.get(r.session_id);
    return {
      sessionTitle: s?.title ?? "(buổi)",
      sessionDate: s?.session_date ?? "",
      status: r.status,
      studentName: studentName.get(r.student_id) ?? "",
    };
  });
}
