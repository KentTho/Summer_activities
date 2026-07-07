/**
 * Data-access cho Admin Control Center (server-only, qua RLS — Admin thấy toàn hệ thống,
 * profiles_select/… cho phép is_admin()). KHÔNG service role cho các READ này.
 */
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Tables } from "@/lib/types";

export interface AdminOverview {
  neighborhoods: number;
  activeNeighborhoods: number;
  secretaries: number;
  parents: number;
  students: number;
  sessions: number;
  sessionsToday: number;
  pendingLeave: number;
}

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

export async function getAdminOverview(): Promise<AdminOverview> {
  const supabase = await createSupabaseServerClient();
  const today = todayISO();
  const [nb, nbActive, sec, par, stu, ses, sesToday, leave] = await Promise.all([
    supabase.from("neighborhoods").select("id", { count: "exact", head: true }),
    supabase.from("neighborhoods").select("id", { count: "exact", head: true }).eq("active", true),
    supabase.from("profiles").select("id", { count: "exact", head: true }).eq("role", "SECRETARY"),
    supabase.from("profiles").select("id", { count: "exact", head: true }).eq("role", "PARENT"),
    supabase.from("students").select("id", { count: "exact", head: true }).is("deleted_at", null),
    supabase.from("activity_sessions").select("id", { count: "exact", head: true }).is("deleted_at", null),
    supabase
      .from("activity_sessions")
      .select("id", { count: "exact", head: true })
      .is("deleted_at", null)
      .eq("session_date", today),
    supabase.from("leave_requests").select("id", { count: "exact", head: true }).eq("status", "SUBMITTED"),
  ]);

  return {
    neighborhoods: nb.count ?? 0,
    activeNeighborhoods: nbActive.count ?? 0,
    secretaries: sec.count ?? 0,
    parents: par.count ?? 0,
    students: stu.count ?? 0,
    sessions: ses.count ?? 0,
    sessionsToday: sesToday.count ?? 0,
    pendingLeave: leave.count ?? 0,
  };
}

export async function listNeighborhoods(): Promise<Tables<"neighborhoods">[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.from("neighborhoods").select("*").order("code");
  if (error) throw error;
  return data ?? [];
}

/** Vai trò phụ trách Khu phố (khớp secretary_neighborhoods.assignment_role). */
export type AssignmentRole = "PRIMARY" | "COORDINATING";

export const ASSIGNMENT_ROLE_LABEL: Record<AssignmentRole, string> = {
  PRIMARY: "Phụ trách chính",
  COORDINATING: "Phụ trách chung",
};

export interface NeighborhoodDetail {
  id: string;
  code: string;
  name: string;
  active: boolean;
  studentCount: number;
  staffCount: number;
  sessionCount: number;
  /** Tên Phụ trách chính (nếu có) — để hiển thị nhanh trong danh sách. */
  primaryName: string | null;
  /** Có dữ liệu gắn (học sinh/buổi/phân công) ⇒ không cho xóa cứng. */
  hasData: boolean;
}

/**
 * Danh sách Khu phố kèm số liệu: học sinh, staff phụ trách, buổi sinh hoạt,
 * và tên Phụ trách chính. Tổng hợp trong bộ nhớ để tránh N+1.
 */
export async function listNeighborhoodsDetailed(): Promise<NeighborhoodDetail[]> {
  const supabase = await createSupabaseServerClient();
  const [neighborhoods, { data: assigns }, secretaries, { data: students }, { data: snb }, { data: sessions }] =
    await Promise.all([
      listNeighborhoods(),
      supabase.from("secretary_neighborhoods").select("secretary_id, neighborhood_id, assignment_role"),
      listSecretaries(),
      supabase.from("students").select("neighborhood_id").is("deleted_at", null),
      supabase.from("session_neighborhoods").select("session_id, neighborhood_id"),
      supabase.from("activity_sessions").select("id").is("deleted_at", null),
    ]);

  const secNameById = new Map(secretaries.map((s) => [s.id, s.full_name]));
  const liveSessionIds = new Set((sessions ?? []).map((s) => s.id));

  const studentCount = new Map<string, number>();
  for (const s of students ?? []) {
    if (!s.neighborhood_id) continue;
    studentCount.set(s.neighborhood_id, (studentCount.get(s.neighborhood_id) ?? 0) + 1);
  }
  const sessionCount = new Map<string, number>();
  for (const row of snb ?? []) {
    if (!liveSessionIds.has(row.session_id)) continue;
    sessionCount.set(row.neighborhood_id, (sessionCount.get(row.neighborhood_id) ?? 0) + 1);
  }
  const staffCount = new Map<string, number>();
  const primaryName = new Map<string, string>();
  for (const a of assigns ?? []) {
    staffCount.set(a.neighborhood_id, (staffCount.get(a.neighborhood_id) ?? 0) + 1);
    if (a.assignment_role === "PRIMARY") {
      primaryName.set(a.neighborhood_id, secNameById.get(a.secretary_id) ?? "—");
    }
  }

  return neighborhoods.map((n) => {
    const students = studentCount.get(n.id) ?? 0;
    const staff = staffCount.get(n.id) ?? 0;
    const ses = sessionCount.get(n.id) ?? 0;
    return {
      id: n.id,
      code: n.code,
      name: n.name,
      active: n.active,
      studentCount: students,
      staffCount: staff,
      sessionCount: ses,
      primaryName: primaryName.get(n.id) ?? null,
      hasData: students > 0 || staff > 0 || ses > 0,
    };
  });
}

export async function listSecretaries(q?: string): Promise<Tables<"profiles">[]> {
  const supabase = await createSupabaseServerClient();
  let query = supabase.from("profiles").select("*").eq("role", "SECRETARY");
  const term = q?.trim();
  if (term) query = query.or(`full_name.ilike.%${term}%,phone.ilike.%${term}%`);
  const { data, error } = await query.order("full_name");
  if (error) throw error;
  return data ?? [];
}

export interface StaffNeighborhood {
  id: string;
  code: string;
  name: string;
  assignmentRole: AssignmentRole;
}

export interface StaffView {
  profile: Tables<"profiles">;
  neighborhoods: StaffNeighborhood[];
}

/** Danh sách tài khoản Bí thư/Chi Đoàn + Khu phố phụ trách (kèm vai trò). */
export async function listStaff(q?: string): Promise<StaffView[]> {
  const supabase = await createSupabaseServerClient();
  const [staff, { data: assigns }, neighborhoods] = await Promise.all([
    listSecretaries(q),
    supabase.from("secretary_neighborhoods").select("secretary_id, neighborhood_id, assignment_role"),
    listNeighborhoods(),
  ]);
  const nbById = new Map(neighborhoods.map((n) => [n.id, n]));
  const bySecretary = new Map<string, StaffNeighborhood[]>();
  for (const a of assigns ?? []) {
    const nb = nbById.get(a.neighborhood_id);
    if (!nb) continue;
    const arr = bySecretary.get(a.secretary_id) ?? [];
    arr.push({
      id: nb.id,
      code: nb.code,
      name: nb.name,
      assignmentRole: a.assignment_role === "PRIMARY" ? "PRIMARY" : "COORDINATING",
    });
    bySecretary.set(a.secretary_id, arr);
  }
  // Phụ trách chính lên đầu để dễ nhìn.
  for (const arr of bySecretary.values()) {
    arr.sort((x, y) => (x.assignmentRole === y.assignmentRole ? 0 : x.assignmentRole === "PRIMARY" ? -1 : 1));
  }
  return staff.map((profile) => ({ profile, neighborhoods: bySecretary.get(profile.id) ?? [] }));
}

export interface ParentView {
  profile: Tables<"profiles">;
  students: Pick<Tables<"students">, "id" | "full_name">[];
}

/** Danh sách tài khoản Phụ huynh/Học sinh + học sinh đã liên kết. */
export async function listParents(q?: string): Promise<ParentView[]> {
  const supabase = await createSupabaseServerClient();
  let query = supabase.from("profiles").select("*").eq("role", "PARENT");
  const term = q?.trim();
  if (term) query = query.or(`full_name.ilike.%${term}%,phone.ilike.%${term}%`);
  const { data: parents, error } = await query.order("full_name");
  if (error) throw error;
  if (!parents || parents.length === 0) return [];

  const parentIds = parents.map((p) => p.id);
  const { data: guardians } = await supabase
    .from("guardians")
    .select("id, profile_id")
    .in("profile_id", parentIds);

  const guardianIds = (guardians ?? []).map((g) => g.id);
  const { data: links } = guardianIds.length
    ? await supabase.from("student_guardians").select("guardian_id, student_id").in("guardian_id", guardianIds)
    : { data: [] as { guardian_id: string; student_id: string }[] };

  const studentIds = [...new Set((links ?? []).map((l) => l.student_id))];
  const { data: students } = studentIds.length
    ? await supabase.from("students").select("id, full_name").in("id", studentIds)
    : { data: [] as { id: string; full_name: string }[] };
  const studentById = new Map((students ?? []).map((s) => [s.id, s]));

  // guardian_id -> profile_id
  const profileByGuardian = new Map((guardians ?? []).map((g) => [g.id, g.profile_id]));
  const byParent = new Map<string, Pick<Tables<"students">, "id" | "full_name">[]>();
  for (const l of links ?? []) {
    const profileId = profileByGuardian.get(l.guardian_id);
    const student = studentById.get(l.student_id);
    if (!profileId || !student) continue;
    const arr = byParent.get(profileId) ?? [];
    arr.push(student);
    byParent.set(profileId, arr);
  }

  return parents.map((profile) => ({ profile, students: byParent.get(profile.id) ?? [] }));
}

/** Học sinh (rút gọn) để chọn khi liên kết phụ huynh. Admin thấy tất cả (RLS). */
export async function listStudentsBrief(): Promise<Pick<Tables<"students">, "id" | "full_name">[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("students")
    .select("id, full_name")
    .is("deleted_at", null)
    .order("full_name");
  if (error) throw error;
  return data ?? [];
}

export interface AuditView {
  id: string;
  action: string;
  entity: string | null;
  detail: string | null;
  createdAt: string;
  actorName: string;
  actorRole: string | null;
}

export async function listAudit(limit = 100): Promise<AuditView[]> {
  const supabase = await createSupabaseServerClient();
  const { data: rows, error } = await supabase
    .from("audit_logs")
    .select("id, action, entity, detail, created_at, actor_id, actor_role")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  if (!rows || rows.length === 0) return [];

  const actorIds = [...new Set(rows.map((r) => r.actor_id).filter((v): v is string => !!v))];
  const { data: actors } = actorIds.length
    ? await supabase.from("profiles").select("id, full_name").in("id", actorIds)
    : { data: [] as { id: string; full_name: string }[] };
  const nameById = new Map((actors ?? []).map((a) => [a.id, a.full_name]));

  return rows.map((r) => ({
    id: r.id,
    action: r.action,
    entity: r.entity,
    detail: r.detail,
    createdAt: r.created_at,
    actorName: r.actor_id ? (nameById.get(r.actor_id) ?? "—") : "hệ thống",
    actorRole: r.actor_role,
  }));
}

export interface AssignmentStaff {
  secretaryId: string;
  name: string;
  staffTitle: string | null;
  active: boolean;
}

export interface NeighborhoodAssignments {
  neighborhoodId: string;
  code: string;
  name: string;
  active: boolean;
  primary: AssignmentStaff | null;
  coordinators: AssignmentStaff[];
}

/**
 * Phân công theo góc nhìn Khu phố: mỗi Khu phố có tối đa 1 Phụ trách chính và
 * nhiều Phụ trách chung. Dùng cho trang `/admin/assignments`.
 */
export async function listNeighborhoodAssignments(): Promise<NeighborhoodAssignments[]> {
  const supabase = await createSupabaseServerClient();
  const [{ data: assigns }, secretaries, neighborhoods] = await Promise.all([
    supabase.from("secretary_neighborhoods").select("secretary_id, neighborhood_id, assignment_role"),
    listSecretaries(),
    listNeighborhoods(),
  ]);
  const secById = new Map(secretaries.map((s) => [s.id, s]));

  const primaryByNb = new Map<string, AssignmentStaff>();
  const coordByNb = new Map<string, AssignmentStaff[]>();
  for (const a of assigns ?? []) {
    const sec = secById.get(a.secretary_id);
    if (!sec) continue;
    const staff: AssignmentStaff = {
      secretaryId: sec.id,
      name: sec.full_name,
      staffTitle: sec.staff_title,
      active: sec.active,
    };
    if (a.assignment_role === "PRIMARY") {
      primaryByNb.set(a.neighborhood_id, staff);
    } else {
      const arr = coordByNb.get(a.neighborhood_id) ?? [];
      arr.push(staff);
      coordByNb.set(a.neighborhood_id, arr);
    }
  }

  return neighborhoods.map((n) => ({
    neighborhoodId: n.id,
    code: n.code,
    name: n.name,
    active: n.active,
    primary: primaryByNb.get(n.id) ?? null,
    coordinators: (coordByNb.get(n.id) ?? []).sort((a, b) => a.name.localeCompare(b.name, "vi")),
  }));
}
