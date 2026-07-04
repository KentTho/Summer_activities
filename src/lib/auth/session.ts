/**
 * Đọc phiên/profile hiện tại phía server.
 * Phase 1 (scaffold): trả về null (chưa nối auth thật). Phase sau sẽ:
 *   1. Lấy auth user từ Supabase (createSupabaseServerClient)
 *   2. Map auth_user_id -> profiles để lấy role, full_name, status
 * Xem helper current_profile_id() trong docs/security.md.
 */
import type { Role } from "@/modules/auth/domain/roles";

export interface CurrentProfile {
  profileId: string;
  authUserId: string;
  role: Role;
  fullName: string;
}

export async function getCurrentProfile(): Promise<CurrentProfile | null> {
  // TODO(Phase 2): triển khai đọc thật từ Supabase Auth + bảng profiles.
  return null;
}
