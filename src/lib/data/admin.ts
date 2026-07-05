/**
 * Data-access tổng quan cho Admin (server-only, qua RLS — Admin thấy toàn hệ thống).
 * Chỉ ĐỌC ở Prompt 06A (chưa full CRUD Admin).
 */
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Tables } from "@/lib/types";

export interface AdminOverview {
  neighborhoods: number;
  activeNeighborhoods: number;
  secretaries: number;
  students: number;
  sessions: number;
}

export async function getAdminOverview(): Promise<AdminOverview> {
  const supabase = await createSupabaseServerClient();
  const [nb, nbActive, sec, stu, ses] = await Promise.all([
    supabase.from("neighborhoods").select("id", { count: "exact", head: true }),
    supabase
      .from("neighborhoods")
      .select("id", { count: "exact", head: true })
      .eq("active", true),
    supabase
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("role", "SECRETARY"),
    supabase
      .from("students")
      .select("id", { count: "exact", head: true })
      .is("deleted_at", null),
    supabase
      .from("activity_sessions")
      .select("id", { count: "exact", head: true })
      .is("deleted_at", null),
  ]);

  return {
    neighborhoods: nb.count ?? 0,
    activeNeighborhoods: nbActive.count ?? 0,
    secretaries: sec.count ?? 0,
    students: stu.count ?? 0,
    sessions: ses.count ?? 0,
  };
}

export async function listNeighborhoods(): Promise<Tables<"neighborhoods">[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("neighborhoods")
    .select("*")
    .order("code");
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
