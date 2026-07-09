/**
 * Data-access yêu cầu đặt lại mật khẩu (09E).
 *  - Tạo yêu cầu: RPC `request_password_reset` (SECURITY DEFINER) — trung lập, chống spam;
 *    gọi được bởi anon (form công khai). KHÔNG tiết lộ tài khoản tồn tại hay không.
 *  - Đọc/đếm: chỉ Admin (RLS `prr_admin_select`).
 */
import "server-only";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Tables } from "@/lib/types";

export type PasswordResetRequest = Tables<"password_reset_requests">;

/** Gửi yêu cầu đặt lại mật khẩu (public). Luôn thành công về mặt UX (trung lập). */
export async function createPasswordResetRequest(
  identifier: string,
  portal: "ADMIN" | "USER",
): Promise<void> {
  const supabase = await createSupabaseServerClient();
  // Bỏ qua lỗi (kể cả khi anon) — không lộ trạng thái; UI luôn báo trung lập.
  await supabase.rpc("request_password_reset", {
    p_identifier: identifier,
    p_portal: portal,
  });
}

/** Danh sách yêu cầu (Admin). Mặc định PENDING trước, mới nhất trên cùng. */
export async function listPasswordResetRequests(
  status?: "PENDING" | "RESOLVED" | "REJECTED",
): Promise<PasswordResetRequest[]> {
  const supabase = await createSupabaseServerClient();
  let query = supabase
    .from("password_reset_requests")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(200);
  if (status) query = query.eq("status", status);
  const { data, error } = await query;
  if (error) return [];
  return data ?? [];
}

/** Số yêu cầu PENDING — cho badge/alert Admin. */
export async function countPendingPasswordRequests(): Promise<number> {
  const supabase = await createSupabaseServerClient();
  const { count, error } = await supabase
    .from("password_reset_requests")
    .select("id", { count: "exact", head: true })
    .eq("status", "PENDING");
  if (error) return 0;
  return count ?? 0;
}
