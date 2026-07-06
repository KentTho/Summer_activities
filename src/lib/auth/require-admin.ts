/**
 * Guard cho Admin server actions: xác thực người gọi là ADMIN trước khi cho phép
 * thao tác nhạy cảm (tạo/reset tài khoản, khóa/mở, gán phụ trách).
 * Đây là điều kiện BẮT BUỘC trước khi dùng service role (theo guardrail 08A).
 * Chặn cuối cùng vẫn là RLS ở Postgres.
 */
import { redirect } from "next/navigation";
import { getCurrentProfile, type CurrentProfile } from "@/lib/auth/session";
import { ROLES } from "@/modules/auth/domain/roles";

export async function requireAdmin(): Promise<CurrentProfile> {
  const profile = await getCurrentProfile();
  if (!profile || profile.role !== ROLES.ADMIN) {
    redirect("/admin/login");
  }
  return profile;
}
