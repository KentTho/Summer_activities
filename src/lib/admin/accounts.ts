/**
 * Cấp phát tài khoản Supabase Auth cho Admin (SERVER-ONLY, service role).
 *
 * ⚠️ Service role BỎ QUA RLS — theo guardrail 08A chỉ dùng để **tạo/reset auth user**,
 * và CHỈ sau khi server action đã xác thực người gọi là ADMIN (requireAdmin).
 * KHÔNG log mật khẩu/token. KHÔNG import ở client.
 */
import { randomBytes } from "node:crypto";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { identifierToEmail } from "@/lib/auth/identifier";

/** Sinh mật khẩu tạm dễ đọc, đủ mạnh (không lưu, chỉ hiển thị 1 lần cho Admin). */
export function generateTempPassword(): string {
  return "Sh" + randomBytes(9).toString("base64url"); // ~14 ký tự
}

async function findAuthUserByEmail(email: string): Promise<string | null> {
  const admin = createSupabaseAdminClient();
  let page = 1;
  for (;;) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw error;
    const found = data.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
    if (found) return found.id;
    if (data.users.length < 200) return null;
    page += 1;
  }
}

export interface CreatedAuthUser {
  authUserId: string;
  email: string;
  alreadyExisted: boolean;
}

/** Tạo auth user (email_confirm) với cờ must_change_password. Idempotent theo email. */
export async function createAuthUser(
  identifier: string,
  password: string,
  fullName: string,
): Promise<CreatedAuthUser> {
  const admin = createSupabaseAdminClient();
  const email = identifierToEmail(identifier);

  const existingId = await findAuthUserByEmail(email);
  if (existingId) return { authUserId: existingId, email, alreadyExisted: true };

  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      full_name: fullName,
      login_identifier: identifier,
      must_change_password: true,
    },
  });
  if (error || !data.user) throw error ?? new Error("Không tạo được auth user.");
  return { authUserId: data.user.id, email, alreadyExisted: false };
}

/** Đặt lại mật khẩu tạm + bật cờ must_change_password (merge metadata). */
export async function resetAuthPassword(authUserId: string, password: string): Promise<void> {
  const admin = createSupabaseAdminClient();
  const { error } = await admin.auth.admin.updateUserById(authUserId, {
    password,
    user_metadata: { must_change_password: true },
  });
  if (error) throw error;
}
