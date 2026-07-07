"use server";

/**
 * Đổi mật khẩu (ép lần đầu hoặc tự nguyện). Người dùng đổi mật khẩu CỦA CHÍNH MÌNH
 * qua `auth.updateUser` (KHÔNG service role) — Supabase yêu cầu phiên hợp lệ.
 * Đổi thành công thì XÓA cờ `must_change_password` trong user_metadata.
 * KHÔNG log mật khẩu. Thông báo lỗi trung lập.
 */
import { redirect } from "next/navigation";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth/session";
import { homeForRole } from "@/lib/auth/rbac";

export interface ChangePasswordState {
  error?: string;
}

const schema = z
  .object({
    password: z
      .string()
      .min(8, "Mật khẩu mới tối thiểu 8 ký tự.")
      .max(72, "Mật khẩu quá dài."),
    confirm: z.string(),
  })
  .refine((v) => v.password === v.confirm, {
    message: "Xác nhận mật khẩu không khớp.",
    path: ["confirm"],
  });

export async function changePassword(
  _prev: ChangePasswordState,
  formData: FormData,
): Promise<ChangePasswordState> {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/user/login");

  const parsed = schema.safeParse({
    password: formData.get("password"),
    confirm: formData.get("confirm"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ." };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.updateUser({
    password: parsed.data.password,
    data: { must_change_password: false },
  });
  if (error) {
    // Supabase chặn đặt lại mật khẩu trùng mật khẩu cũ, mật khẩu yếu, v.v.
    return { error: "Không đổi được mật khẩu. Hãy chọn mật khẩu khác, mạnh hơn." };
  }

  redirect(homeForRole(profile.role));
}
