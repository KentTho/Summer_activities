"use server";

/**
 * Gửi yêu cầu đặt lại mật khẩu (công khai — người dùng CHƯA đăng nhập).
 * Không tự đổi mật khẩu; chỉ tạo yêu cầu để Admin xử lý (cấp mật khẩu tạm).
 * TRUNG LẬP: luôn trả cùng một thông báo, KHÔNG tiết lộ tài khoản có tồn tại hay không.
 * KHÔNG gửi email/SMS thật. Chống spam ở tầng RPC (SECURITY DEFINER).
 */
import { z } from "zod";
import { createPasswordResetRequest } from "@/lib/data/password-requests";

export interface ForgotPasswordState {
  done?: boolean;
  error?: string;
}

const schema = z.object({
  identifier: z.string().trim().min(3, "Nhập số điện thoại hoặc tài khoản.").max(120),
});

export async function submitForgotPassword(
  _prev: ForgotPasswordState,
  formData: FormData,
): Promise<ForgotPasswordState> {
  const parsed = schema.safeParse({
    identifier: formData.get("identifier"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ." };
  }

  try {
    // Portal separation 10C: public forgot-password is USER-only.
    // Ignore any forged client `portal=ADMIN`; Admin recovery is server/local break-glass.
    await createPasswordResetRequest(parsed.data.identifier, "USER");
  } catch {
    // Vẫn trả trung lập — không lộ lỗi/hệ thống.
  }
  return { done: true };
}
