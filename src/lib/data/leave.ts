/**
 * Data-access đơn xin nghỉ (server-only, qua RLS).
 * RLS quyết định ai thấy đơn nào: Bí thư thấy đơn học sinh trong phạm vi;
 * phụ huynh thấy đơn của con mình. Cùng một truy vấn, RLS lọc theo người đăng nhập.
 */
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { LeaveStatus } from "@/modules/leave-requests/domain/leave-status";

export interface LeaveRequestItem {
  id: string;
  status: LeaveStatus;
  reason: string | null;
  createdAt: string;
  studentId: string;
  studentName: string;
  sessionId: string | null;
  sessionTitle: string | null;
  sessionDate: string | null;
}

export async function listLeaveRequests(): Promise<LeaveRequestItem[]> {
  const supabase = await createSupabaseServerClient();

  const { data: rows, error } = await supabase
    .from("leave_requests")
    .select("id, status, reason, created_at, student_id, session_id")
    .order("created_at", { ascending: false });
  if (error) throw error;
  if (!rows || rows.length === 0) return [];

  const studentIds = [...new Set(rows.map((r) => r.student_id))];
  const sessionIds = [...new Set(rows.map((r) => r.session_id).filter((v): v is string => !!v))];

  const [{ data: students }, sessionsRes] = await Promise.all([
    supabase.from("students").select("id, full_name").in("id", studentIds),
    sessionIds.length > 0
      ? supabase
          .from("activity_sessions")
          .select("id, title, session_date")
          .in("id", sessionIds)
      : Promise.resolve({ data: [] as { id: string; title: string; session_date: string }[] }),
  ]);

  const studentName = new Map((students ?? []).map((s) => [s.id, s.full_name]));
  const sessionById = new Map((sessionsRes.data ?? []).map((s) => [s.id, s]));

  return rows.map((r) => {
    const sess = r.session_id ? sessionById.get(r.session_id) : null;
    return {
      id: r.id,
      status: r.status,
      reason: r.reason,
      createdAt: r.created_at,
      studentId: r.student_id,
      studentName: studentName.get(r.student_id) ?? "(học sinh)",
      sessionId: r.session_id,
      sessionTitle: sess?.title ?? null,
      sessionDate: sess?.session_date ?? null,
    };
  });
}
