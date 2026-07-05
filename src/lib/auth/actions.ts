"use server";

/**
 * Server Actions cho Auth thật (Prompt 05).
 * - signInAdmin / signInUser: đăng nhập bằng email + mật khẩu qua Supabase Auth,
 *   kiểm tra vai trò khớp cổng, rồi redirect theo ROLE_HOME.
 * - signOut: đăng xuất và quay lại trang login của cổng.
 *
 * Không hardcode mật khẩu. Không lộ chi tiết lỗi nhạy cảm (thông báo trung lập).
 */
import { redirect } from "next/navigation";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { loadProfileForAuthUser } from "@/lib/auth/session";
import { identifierToEmail } from "@/lib/auth/identifier";
import { homeForRole } from "@/lib/auth/rbac";
import { ROLES } from "@/modules/auth/domain/roles";

export interface SignInState {
  error?: string;
}

type Portal = "admin" | "user";

const credentialsSchema = z.object({
  identifier: z.string().trim().min(1, "Vui lòng nhập tài khoản."),
  password: z.string().min(1, "Vui lòng nhập mật khẩu."),
});

async function signInWithPortal(
  portal: Portal,
  formData: FormData,
): Promise<SignInState> {
  const parsed = credentialsSchema.safeParse({
    identifier: formData.get("identifier"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ." };
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email: identifierToEmail(parsed.data.identifier),
    password: parsed.data.password,
  });

  if (error || !data.user) {
    return { error: "Email hoặc mật khẩu không đúng." };
  }

  const profile = await loadProfileForAuthUser(supabase, data.user.id);
  if (!profile) {
    // Có auth user nhưng không có hồ sơ hợp lệ (hoặc bị khóa) — không cho vào.
    await supabase.auth.signOut();
    return {
      error: "Tài khoản chưa có hồ sơ hợp lệ hoặc đã bị vô hiệu hóa.",
    };
  }

  const allowed =
    portal === "admin"
      ? profile.role === ROLES.ADMIN
      : profile.role !== ROLES.ADMIN; // cổng Người dùng: SECRETARY / PARENT

  if (!allowed) {
    await supabase.auth.signOut();
    return {
      error:
        portal === "admin"
          ? "Tài khoản này không phải Quản trị viên."
          : "Tài khoản Quản trị vui lòng dùng cổng Quản trị.",
    };
  }

  redirect(homeForRole(profile.role));
}

/** useActionState signature: (prevState, formData). Cổng Quản trị. */
export async function signInAdmin(
  _prev: SignInState,
  formData: FormData,
): Promise<SignInState> {
  return signInWithPortal("admin", formData);
}

/** useActionState signature: (prevState, formData). Cổng Người dùng. */
export async function signInUser(
  _prev: SignInState,
  formData: FormData,
): Promise<SignInState> {
  return signInWithPortal("user", formData);
}

/** Đăng xuất; `portal` quyết định quay về cổng login nào. */
export async function signOut(portal: Portal): Promise<void> {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect(portal === "admin" ? "/admin/login" : "/user/login");
}
