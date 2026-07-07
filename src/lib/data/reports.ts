/**
 * Dữ liệu cho báo cáo DOCX (server-only, qua RLS — KHÔNG service role).
 * Bí thư/Chi Đoàn chỉ thấy dữ liệu trong phạm vi Khu phố phụ trách; Admin thấy
 * toàn hệ thống — đều do RLS Postgres quyết định, không mở rộng quyền ở đây.
 */
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getSessionDetail, getSessionRoster } from "@/lib/data/sessions";
import { ATTENDANCE_STATUS_LABEL } from "@/modules/attendance/domain/attendance-status";

export interface StudentReportRow {
  fullName: string;
  birth: string;
  school: string;
  guardianName: string;
  guardianPhone: string;
  neighborhoodName: string;
}

export interface StudentReport {
  rows: StudentReportRow[];
  neighborhoodNames: string[];
}

/** Danh sách học sinh trong phạm vi (RLS) cho báo cáo — kèm tên Khu phố. */
export async function getStudentReport(): Promise<StudentReport> {
  const supabase = await createSupabaseServerClient();
  const { data: students, error } = await supabase
    .from("students")
    .select("full_name, birth_date, birth_year, school, guardian_name, guardian_phone, neighborhood_id")
    .is("deleted_at", null)
    .order("full_name");
  if (error) throw error;

  const neighborhoodIds = [...new Set((students ?? []).map((s) => s.neighborhood_id))];
  const nameById = new Map<string, string>();
  if (neighborhoodIds.length > 0) {
    const { data: neigh } = await supabase
      .from("neighborhoods")
      .select("id, name")
      .in("id", neighborhoodIds);
    for (const n of neigh ?? []) nameById.set(n.id, n.name);
  }

  const rows: StudentReportRow[] = (students ?? []).map((s) => ({
    fullName: s.full_name,
    birth: s.birth_date ?? (s.birth_year ? String(s.birth_year) : ""),
    school: s.school ?? "",
    guardianName: s.guardian_name ?? "",
    guardianPhone: s.guardian_phone ?? "",
    neighborhoodName: nameById.get(s.neighborhood_id) ?? "—",
  }));

  return { rows, neighborhoodNames: [...nameById.values()].sort((a, b) => a.localeCompare(b, "vi")) };
}

export interface AttendanceReportRow {
  fullName: string;
  neighborhoodName: string;
  guardianPhone: string;
  statusLabel: string;
  note: string;
}

export interface AttendanceReport {
  title: string;
  sessionDate: string;
  location: string;
  neighborhoodNames: string[];
  rows: AttendanceReportRow[];
  summary: { present: number; excused: number; unexcused: number; notMarked: number; total: number };
}

/** Số liệu điểm danh của một buổi cho báo cáo (RLS chặn buổi ngoài phạm vi → null). */
export async function getAttendanceReport(sessionId: string): Promise<AttendanceReport | null> {
  const detail = await getSessionDetail(sessionId);
  if (!detail) return null;
  const roster = await getSessionRoster(sessionId);

  const nameById = new Map(detail.neighborhoods.map((n) => [n.id, n.name]));
  const summary = { present: 0, excused: 0, unexcused: 0, notMarked: 0, total: roster.length };
  const rows: AttendanceReportRow[] = roster.map((r) => {
    if (r.status === "PRESENT") summary.present += 1;
    else if (r.status === "EXCUSED") summary.excused += 1;
    else if (r.status === "UNEXCUSED") summary.unexcused += 1;
    else summary.notMarked += 1;
    return {
      fullName: r.fullName,
      neighborhoodName: nameById.get(r.neighborhoodId) ?? "—",
      guardianPhone: r.guardianPhone ?? "",
      statusLabel: r.status ? ATTENDANCE_STATUS_LABEL[r.status] : "Chưa điểm danh",
      note: r.note ?? "",
    };
  });

  return {
    title: detail.session.title,
    sessionDate: detail.session.session_date,
    location: detail.session.location ?? "",
    neighborhoodNames: detail.neighborhoods.map((n) => n.name),
    rows,
    summary,
  };
}
