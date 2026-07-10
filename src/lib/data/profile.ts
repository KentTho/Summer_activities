/**
 * Data-access "Trung tâm thông tin cá nhân" (10B). Server-only, qua RLS.
 * Đọc hồ sơ của chính người đăng nhập + thông tin theo vai trò (phân công/HS liên kết).
 * Cập nhật CHỈ qua RPC `update_own_profile` (SECURITY DEFINER) — không đổi role/active.
 */
import "server-only";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth/session";

export interface MyProfile {
  id: string;
  role: string;
  fullName: string;
  phone: string | null;
  email: string | null;
  staffTitle: string | null;
  active: boolean;
  mustChangePassword: boolean;
}

export interface MyAssignment {
  neighborhoodCode: string;
  neighborhoodName: string;
  assignmentRole: string;
}

export interface MyLinkedStudent {
  id: string;
  fullName: string;
  birthYear: number | null;
  neighborhoodName: string | null;
  relationship: string | null;
}

/** Hồ sơ chi tiết của người đăng nhập (đọc trực tiếp từ profiles qua RLS). */
export async function getMyProfileDetails(): Promise<MyProfile | null> {
  const current = await getCurrentProfile();
  if (!current) return null;
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("profiles")
    .select("id, role, full_name, phone, email, staff_title, active")
    .eq("id", current.profileId)
    .maybeSingle();
  if (!data) return null;
  return {
    id: data.id,
    role: data.role,
    fullName: data.full_name,
    phone: data.phone,
    email: data.email,
    staffTitle: data.staff_title,
    active: data.active,
    mustChangePassword: current.mustChangePassword,
  };
}

/** Khu phố + vai trò phụ trách của Bí thư đăng nhập. */
export async function getMyNeighborhoodAssignments(): Promise<MyAssignment[]> {
  const current = await getCurrentProfile();
  if (!current) return [];
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("secretary_neighborhoods")
    .select("assignment_role, neighborhoods(code, name)")
    .eq("secretary_id", current.profileId);
  return (data ?? []).map((r) => ({
    neighborhoodCode: r.neighborhoods?.code ?? "?",
    neighborhoodName: r.neighborhoods?.name ?? "",
    assignmentRole: r.assignment_role,
  }));
}

/** Học sinh liên kết với Phụ huynh đăng nhập (chỉ đọc; sửa nhạy cảm cần Bí thư/Admin). */
export async function getMyLinkedStudents(): Promise<MyLinkedStudent[]> {
  const current = await getCurrentProfile();
  if (!current) return [];
  const supabase = await createSupabaseServerClient();
  const { data: guardian } = await supabase
    .from("guardians")
    .select("id")
    .eq("profile_id", current.profileId)
    .maybeSingle();
  if (!guardian) return [];
  const { data: links } = await supabase
    .from("student_guardians")
    .select("relationship, students(id, full_name, birth_year, neighborhoods(name))")
    .eq("guardian_id", guardian.id);
  return (links ?? [])
    .filter((l) => l.students)
    .map((l) => ({
      id: l.students!.id,
      fullName: l.students!.full_name,
      birthYear: l.students!.birth_year,
      neighborhoodName: l.students!.neighborhoods?.name ?? null,
      relationship: l.relationship,
    }));
}
