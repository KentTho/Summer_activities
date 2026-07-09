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
  portal: z.enum(["ADMIN", "USER"]).default("USER"),
});

export async function submitForgotPassword(
  _prev: ForgotPasswordState,
  formData: FormData,
): Promise<ForgotPasswordState> {
  const parsed = schema.safeParse({
    identifier: formData.get("identifier"),
    portal: formData.get("portal") ?? "USER",
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ." };
  }

  try {
    await createPasswordResetRequest(parsed.data.identifier, parsed.data.portal);
  } catch {
    // Vẫn trả trung lập — không lộ lỗi/hệ thống.
  }
  return { done: true };
}
