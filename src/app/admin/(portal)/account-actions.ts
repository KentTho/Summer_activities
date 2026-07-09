"use server";

/**
 * Server Actions tài khoản dùng chung cho Admin (staff + phụ huynh).
 * BẮT BUỘC requireAdmin() trước mọi thao tác. Service role CHỈ để reset auth password.
 * Reset chỉ tạo mật khẩu TẠM + set must_change_password; Admin không xem mật khẩu thật.
 * "Xóa" tài khoản = khóa (deactivate), KHÔNG hard-delete.
 */
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth/require-admin";
import { generateTempPassword, resetAuthPassword } from "@/lib/admin/accounts";
import { logAudit } from "@/lib/admin/audit";

export interface AccountActionState {
  error?: string;
  ok?: boolean;
  /** Mật khẩu tạm — hiển thị MỘT LẦN cho Admin, không lưu, không log. */
  tempPassword?: string;
}

/** Reset mật khẩu tạm cho một tài khoản (staff hoặc phụ huynh). */
export async function resetPassword(
  _prev: AccountActionState,
  formData: FormData,
): Promise<AccountActionState> {
  const admin = await requireAdmin();
  const profileId = z.string().uuid().safeParse(formData.get("profile_id"));
  if (!profileId.success) return { error: "Thiếu mã tài khoản." };

  const supabase = await createSupabaseServerClient();
  const { data: prof } = await supabase
    .from("profiles")
    .select("auth_user_id")
    .eq("id", profileId.data)
    .maybeSingle();
  if (!prof) return { error: "Không tìm thấy tài khoản." };

  const tempPassword = generateTempPassword();
  try {
    await resetAuthPassword(prof.auth_user_id, tempPassword);
  } catch {
    return { error: "Không đặt lại được mật khẩu (thử lại)." };
  }

  await logAudit(supabase, admin, {
    action: "RESET_PASSWORD",
    entity: "profiles",
    detail: profileId.data,
  });
  revalidatePath("/admin/secretaries");
  revalidatePath("/admin/parents");
  return { ok: true, tempPassword };
}

/** Khóa/mở tài khoản (deactivate/activate). Không cho tự khóa chính mình. */
export async function setAccountActive(formData: FormData): Promise<void> {
  const admin = await requireAdmin();
  const profileId = z.string().uuid().safeParse(formData.get("profile_id"));
  const active = String(formData.get("active")) === "true";
  if (!profileId.success) return;
  if (profileId.data === admin.profileId) return; // không tự khóa chính mình

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("profiles")
    .update({ active })
    .eq("id", profileId.data);
  if (error) return;

  await logAudit(supabase, admin, {
    action: active ? "UNLOCK_ACCOUNT" : "LOCK_ACCOUNT",
    entity: "profiles",
    detail: profileId.data,
  });
  revalidatePath("/admin/secretaries");
  revalidatePath("/admin/parents");
}
