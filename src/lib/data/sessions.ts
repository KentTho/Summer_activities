/**
 * Data-access buổi sinh hoạt + điểm danh (server-only, đi qua RLS).
 * KHÔNG service role. RLS đảm bảo Bí thư chỉ thấy/ghi buổi & học sinh trong phạm vi.
 * Không dùng nested-select để type rõ ràng; gộp bằng vài truy vấn theo id.
 */
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Tables } from "@/lib/types";
import type { AttendanceStatus } from "@/modules/attendance/domain/attendance-status";

export type SessionRow = Tables<"activity_sessions">;
export type NeighborhoodRow = Tables<"neighborhoods">;

export interface SessionCounts {
  present: number;
  excused: number;
  unexcused: number;
  marked: number;
}

export interface SessionListItem {
  session: SessionRow;
  neighborhoods: Pick<NeighborhoodRow, "id" | "code" | "name">[];
  counts: SessionCounts;
}

function emptyCounts(): SessionCounts {
  return { present: 0, excused: 0, unexcused: 0, marked: 0 };
}

/** Danh sách buổi (RLS giới hạn theo phạm vi). Kèm Khu phố + thống kê điểm danh. */
export async function listSessions(limit = 100): Promise<SessionListItem[]> {
  const supabase = await createSupabaseServerClient();

  const { data: sessions, error } = await supabase
    .from("activity_sessions")
    .select("*")
    .is("deleted_at", null)
    .order("session_date", { ascending: false })
    .limit(limit);
  if (error) throw error;
  if (!sessions || sessions.length === 0) return [];

  const sessionIds = sessions.map((s) => s.id);

  const [{ data: snb }, { data: att }] = await Promise.all([
    supabase
      .from("session_neighborhoods")
      .select("session_id, neighborhood_id")
      .in("session_id", sessionIds),
    supabase
      .from("attendance_records")
      .select("session_id, status")
      .in("session_id", sessionIds),
  ]);

  const neighborhoodIds = [...new Set((snb ?? []).map((r) => r.neighborhood_id))];
  const neighById = new Map<string, Pick<NeighborhoodRow, "id" | "code" | "name">>();
  if (neighborhoodIds.length > 0) {
    const { data: neigh } = await supabase
      .from("neighborhoods")
      .select("id, code, name")
      .in("id", neighborhoodIds);
    for (const n of neigh ?? []) neighById.set(n.id, n);
  }

  const neighBySession = new Map<string, Pick<NeighborhoodRow, "id" | "code" | "name">[]>();
  for (const link of snb ?? []) {
    const n = neighById.get(link.neighborhood_id);
    if (!n) continue;
    const arr = neighBySession.get(link.session_id) ?? [];
    arr.push(n);
    neighBySession.set(link.session_id, arr);
  }

  const countsBySession = new Map<string, SessionCounts>();
  for (const rec of att ?? []) {
    const c = countsBySession.get(rec.session_id) ?? emptyCounts();
    c.marked += 1;
    if (rec.status === "PRESENT") c.present += 1;
    else if (rec.status === "EXCUSED") c.excused += 1;
    else if (rec.status === "UNEXCUSED") c.unexcused += 1;
    countsBySession.set(rec.session_id, c);
  }

  return sessions.map((session) => ({
    session,
    neighborhoods: neighBySession.get(session.id) ?? [],
    counts: countsBySession.get(session.id) ?? emptyCounts(),
  }));
}

export interface SessionDetail {
  session: SessionRow;
  neighborhoods: Pick<NeighborhoodRow, "id" | "code" | "name">[];
}

export async function getSessionDetail(id: string): Promise<SessionDetail | null> {
  const supabase = await createSupabaseServerClient();
  const { data: session, error } = await supabase
    .from("activity_sessions")
    .select("*")
    .eq("id", id)
    .is("deleted_at", null)
    .maybeSingle();
  if (error) throw error;
  if (!session) return null;

  const { data: snb } = await supabase
    .from("session_neighborhoods")
    .select("neighborhood_id")
    .eq("session_id", id);
  const ids = (snb ?? []).map((r) => r.neighborhood_id);

  let neighborhoods: Pick<NeighborhoodRow, "id" | "code" | "name">[] = [];
  if (ids.length > 0) {
    const { data: neigh } = await supabase
      .from("neighborhoods")
      .select("id, code, name")
      .in("id", ids)
      .order("code");
    neighborhoods = neigh ?? [];
  }
  return { session, neighborhoods };
}

export interface RosterEntry {
  studentId: string;
  fullName: string;
  neighborhoodId: string;
  guardianPhone: string | null;
  status: AttendanceStatus | null;
  note: string | null;
}

/**
 * Danh sách điểm danh của một buổi: học sinh thuộc các Khu phố của buổi (trong
 * phạm vi RLS) + trạng thái đã ghi (null = CHƯA điểm danh / NOT_MARKED).
 * `q` (tùy chọn): tìm theo tên học sinh hoặc SĐT phụ huynh.
 */
export async function getSessionRoster(
  sessionId: string,
  q?: string,
): Promise<RosterEntry[]> {
  const supabase = await createSupabaseServerClient();

  const { data: snb } = await supabase
    .from("session_neighborhoods")
    .select("neighborhood_id")
    .eq("session_id", sessionId);
  const neighborhoodIds = (snb ?? []).map((r) => r.neighborhood_id);
  if (neighborhoodIds.length === 0) return [];

  let studentQuery = supabase
    .from("students")
    .select("id, full_name, neighborhood_id, guardian_phone")
    .in("neighborhood_id", neighborhoodIds)
    .is("deleted_at", null)
    .eq("active", true);

  const term = q?.trim();
  if (term) {
    const safe = term.replace(/[%,()]/g, " ");
    studentQuery = studentQuery.or(`full_name.ilike.%${safe}%,guardian_phone.ilike.%${safe}%`);
  }

  const [{ data: students }, { data: att }] = await Promise.all([
    studentQuery.order("full_name"),
    supabase
      .from("attendance_records")
      .select("student_id, status, note")
      .eq("session_id", sessionId),
  ]);

  const byStudent = new Map<string, { status: AttendanceStatus; note: string | null }>();
  for (const a of att ?? []) byStudent.set(a.student_id, { status: a.status, note: a.note });

  return (students ?? []).map((s) => {
    const rec = byStudent.get(s.id);
    return {
      studentId: s.id,
      fullName: s.full_name,
      neighborhoodId: s.neighborhood_id,
      guardianPhone: s.guardian_phone,
      status: rec?.status ?? null,
      note: rec?.note ?? null,
    };
  });
}
