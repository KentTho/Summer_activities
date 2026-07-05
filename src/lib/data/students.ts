/**
 * Data-access học sinh (server-only, đi qua RLS — KHÔNG dùng service role).
 * Bí thư chỉ đọc/ghi được học sinh thuộc Khu phố được phân công (đảm bảo bởi RLS).
 * (Server-only tự nhiên vì dùng createSupabaseServerClient → next/headers cookies.)
 */
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Tables } from "@/lib/types";

export type StudentRow = Tables<"students">;
export type NeighborhoodRow = Tables<"neighborhoods">;

export type StudentStatusFilter = "active" | "inactive" | "all";

export interface StudentFilters {
  q?: string;
  neighborhoodId?: string;
  school?: string;
  status?: StudentStatusFilter;
}

/** Khu phố mà Bí thư hiện tại được phân công (Admin: rỗng ở hàm này — dùng listAllNeighborhoods). */
export async function listNeighborhoodsInScope(): Promise<NeighborhoodRow[]> {
  const supabase = await createSupabaseServerClient();
  const { data: assigns, error } = await supabase
    .from("secretary_neighborhoods")
    .select("neighborhood_id");
  if (error) throw error;

  const ids = (assigns ?? []).map((a) => a.neighborhood_id);
  if (ids.length === 0) return [];

  const { data, error: nErr } = await supabase
    .from("neighborhoods")
    .select("*")
    .in("id", ids)
    .order("code");
  if (nErr) throw nErr;
  return data ?? [];
}

/** Danh sách học sinh trong phạm vi (RLS tự giới hạn theo Khu phố phụ trách). */
export async function listStudents(
  filters: StudentFilters = {},
): Promise<StudentRow[]> {
  const supabase = await createSupabaseServerClient();
  let query = supabase.from("students").select("*");

  // Mặc định ẩn bản ghi đã xóa mềm (RLS cũng ẩn với non-admin, nhưng rõ ràng hơn).
  query = query.is("deleted_at", null);

  if (filters.status === "active") query = query.eq("active", true);
  else if (filters.status === "inactive") query = query.eq("active", false);

  if (filters.neighborhoodId) query = query.eq("neighborhood_id", filters.neighborhoodId);
  if (filters.school) query = query.eq("school", filters.school);
  if (filters.q && filters.q.trim()) {
    query = query.ilike("full_name", `%${filters.q.trim()}%`);
  }

  const { data, error } = await query.order("full_name");
  if (error) throw error;
  return data ?? [];
}

/** Các trường học có trong phạm vi (để đổ vào bộ lọc). */
export async function listSchoolsInScope(): Promise<string[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("students")
    .select("school")
    .is("deleted_at", null)
    .not("school", "is", null);
  if (error) throw error;
  const set = new Set<string>();
  for (const r of data ?? []) if (r.school) set.add(r.school);
  return [...set].sort((a, b) => a.localeCompare(b, "vi"));
}
