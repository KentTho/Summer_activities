/**
 * Đọc phiên/profile hiện tại phía server (Auth thật — Prompt 05).
 *   1. Lấy auth user từ Supabase (createSupabaseServerClient + auth.getUser()).
 *   2. Map auth_user_id -> public.profiles để lấy role, full_name, active.
 * RLS cho phép user đọc đúng hàng của mình (profiles_select: id = current_profile_id()).
 * Chặn cuối cùng vẫn là RLS ở Postgres — lớp này chỉ tiện cho guard/UI.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isRole, type Role } from "@/modules/auth/domain/roles";
import type { Database } from "@/lib/database.types";

export interface CurrentProfile {
  profileId: string;
  authUserId: string;
  role: Role;
  fullName: string;
  active: boolean;
}

/** Đọc hàng profiles theo auth user id với client đã cho (tái dùng cho login action). */
export async function loadProfileForAuthUser(
  supabase: SupabaseClient<Database>,
  authUserId: string,
): Promise<CurrentProfile | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, role, full_name, active")
    .eq("auth_user_id", authUserId)
    .maybeSingle();

  if (error || !data || !isRole(data.role) || !data.active) {
    return null;
  }

  return {
    profileId: data.id,
    authUserId,
    role: data.role,
    fullName: data.full_name,
    active: data.active,
  };
}

/**
 * Profile của phiên hiện tại, hoặc null nếu chưa đăng nhập / không có hồ sơ hợp lệ.
 * Dùng `getUser()` (xác thực với Auth server) chứ không tin cookie thô.
 */
export async function getCurrentProfile(): Promise<CurrentProfile | null> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  return loadProfileForAuthUser(supabase, user.id);
}
