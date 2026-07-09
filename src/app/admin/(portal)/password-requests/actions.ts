"use server";

/**
 * Xử lý yêu cầu đặt lại mật khẩu (Admin). requireAdmin() BẮT BUỘC.
 *  - Cấp mật khẩu tạm: reset auth user của hồ sơ khớp (service role, sau requireAdmin) +
 *    bật must_change_password → RESOLVED. Mật khẩu tạm hiển thị MỘT LẦN, không lưu/log.
 *  - Từ chối: đánh dấu REJECTED (vd yêu cầu rác).
 * Mọi thao tác ghi audit, KHÔNG log mật khẩu/PII.
 */
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth/require-admin";
import { generateTempPassword, resetAuthPassword } from "@/lib/admin/accounts";
import { logAudit } from "@/lib/admin/audit";
import type { AccountActionState } from "../account-actions";

export async function resolvePasswordRequest(
  _prev: AccountActionState,
  formData: FormData,
): Promise<AccountActionState> {
  const admin = await requireAdmin();
  const requestId = z.string().uuid().safeParse(formData.get("request_id"));
  if (!requestId.success) return { error: "Thiếu mã yêu cầu." };

  const supabase = await createSupabaseServerClient();
  const { data: req } = await supabase
    .from("password_reset_requests")
    .select("id, status, matched_profile_id")
    .eq("id", requestId.data)
    .maybeSingle();
  if (!req) return { error: "Không tìm thấy yêu cầu." };
  if (req.status !== "PENDING") return { error: "Yêu cầu đã được xử lý." };
  if (!req.matched_profile_id) {
    return {
      error:
        "Không tìm thấy hồ sơ khớp tự động. Hãy tìm tài khoản ở trang Bí thư/Phụ huynh rồi đặt lại mật khẩu, sau đó từ chối yêu cầu này.",
    };
  }

  const { data: prof } = await supabase
    .from("profiles")
    .select("auth_user_id")
    .eq("id", req.matched_profile_id)
    .maybeSingle();
  if (!prof) return { error: "Hồ sơ khớp không còn tồn tại." };

  const tempPassword = generateTempPassword();
  try {
    await resetAuthPassword(prof.auth_user_id, tempPassword);
  } catch {
    return { error: "Không đặt lại được mật khẩu (thử lại)." };
  }

  await supabase
    .from("password_reset_requests")
    .update({ status: "RESOLVED", resolved_at: new Date().toISOString(), resolved_by: admin.profileId })
    .eq("id", requestId.data);

  await logAudit(supabase, admin, {
    action: "RESOLVE_PASSWORD_RESET_REQUEST",
    entity: "password_reset_requests",
    detail: `request ${requestId.data}, profile ${req.matched_profile_id}`,
  });
  revalidatePath("/admin/password-requests");
  revalidatePath("/admin");
  return { ok: true, tempPassword };
}

export async function rejectPasswordRequest(formData: FormData): Promise<void> {
  const admin = await requireAdmin();
  const requestId = z.string().uuid().safeParse(formData.get("request_id"));
  if (!requestId.success) return;

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("password_reset_requests")
    .update({ status: "REJECTED", resolved_at: new Date().toISOString(), resolved_by: admin.profileId })
    .eq("id", requestId.data)
    .eq("status", "PENDING");
  if (error) return;

  await logAudit(supabase, admin, {
    action: "REJECT_PASSWORD_RESET_REQUEST",
    entity: "password_reset_requests",
    detail: requestId.data,
  });
  revalidatePath("/admin/password-requests");
  revalidatePath("/admin");
}
