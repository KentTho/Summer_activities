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

export async function listSecretaries(): Promise<Tables<"profiles">[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("role", "SECRETARY")
    .order("full_name");
  if (error) throw error;
  return data ?? [];
}

export interface StaffView {
  profile: Tables<"profiles">;
  neighborhoods: Pick<Tables<"neighborhoods">, "id" | "code" | "name">[];
}

/** Danh sách tài khoản Bí thư/Chi Đoàn + Khu phố được gán. */
export async function listStaff(): Promise<StaffView[]> {
  const supabase = await createSupabaseServerClient();
  const [staff, { data: assigns }, neighborhoods] = await Promise.all([
    listSecretaries(),
    supabase.from("secretary_neighborhoods").select("secretary_id, neighborhood_id"),
    listNeighborhoods(),
  ]);
  const nbById = new Map(neighborhoods.map((n) => [n.id, n]));
  const bySecretary = new Map<string, Pick<Tables<"neighborhoods">, "id" | "code" | "name">[]>();
  for (const a of assigns ?? []) {
    const nb = nbById.get(a.neighborhood_id);
    if (!nb) continue;
    const arr = bySecretary.get(a.secretary_id) ?? [];
    arr.push({ id: nb.id, code: nb.code, name: nb.name });
    bySecretary.set(a.secretary_id, arr);
  }
  return staff.map((profile) => ({ profile, neighborhoods: bySecretary.get(profile.id) ?? [] }));
}

export interface ParentView {
  profile: Tables<"profiles">;
  students: Pick<Tables<"students">, "id" | "full_name">[];
}

/** Danh sách tài khoản Phụ huynh/Học sinh + học sinh đã liên kết. */
export async function listParents(): Promise<ParentView[]> {
  const supabase = await createSupabaseServerClient();
  const { data: parents, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("role", "PARENT")
    .order("full_name");
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

export interface AssignmentView {
  id: string;
  secretaryName: string;
  neighborhoodName: string;
  neighborhoodCode: string;
}

export async function listAssignments(): Promise<AssignmentView[]> {
  const supabase = await createSupabaseServerClient();
  const [{ data: assigns }, secretaries, neighborhoods] = await Promise.all([
    supabase.from("secretary_neighborhoods").select("*"),
    listSecretaries(),
    listNeighborhoods(),
  ]);
  const secById = new Map(secretaries.map((s) => [s.id, s.full_name]));
  const nbById = new Map(neighborhoods.map((n) => [n.id, n]));
  return (assigns ?? []).map((a) => {
    const nb = nbById.get(a.neighborhood_id);
    return {
      id: a.id,
      secretaryName: secById.get(a.secretary_id) ?? "—",
      neighborhoodName: nb?.name ?? "—",
      neighborhoodCode: nb?.code ?? "—",
    };
  });
}
