"use server";

/**
 * Server Actions quản lý tài khoản Phụ huynh/Học sinh (role PARENT) + liên kết
 * phụ huynh ↔ học sinh (guardians + student_guardians).
 * requireAdmin() BẮT BUỘC. Service role CHỈ để tạo auth user; phần còn lại qua RLS.
 */
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth/require-admin";
import { createAuthUser, generateTempPassword } from "@/lib/admin/accounts";
import { logAudit } from "@/lib/admin/audit";
import type { AccountActionState } from "../account-actions";

const parentSchema = z.object({
  identifier: z.string().trim().min(3, "Tên đăng nhập/SĐT quá ngắn.").max(120),
  full_name: z.string().trim().min(2, "Họ tên quá ngắn.").max(120),
  phone: z
    .string()
    .trim()
    .max(20)
    .optional()
    .transform((v) => (v ? v : null)),
});

/** Lấy/ tạo guardian gắn với một profile phụ huynh (qua RLS). */
async function ensureGuardianForProfile(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  profileId: string,
  fullName: string,
  phone: string | null,
): Promise<string | null> {
  const { data: existing } = await supabase
    .from("guardians")
    .select("id")
    .eq("profile_id", profileId)
    .maybeSingle();
  if (existing) return existing.id;
  const { data: created, error } = await supabase
    .from("guardians")
    .insert({ profile_id: profileId, full_name: fullName, phone })
    .select("id")
    .single();
  if (error || !created) return null;
  return created.id;
}

export async function createParent(
  _prev: AccountActionState,
  formData: FormData,
): Promise<AccountActionState> {
  const admin = await requireAdmin();
  const parsed = parentSchema.safeParse({
    identifier: formData.get("identifier"),
    full_name: formData.get("full_name"),
    phone: formData.get("phone") ?? "",
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ." };
  }

  const tempPassword = generateTempPassword();
  let authUserId: string;
  let email: string;
  let alreadyExisted: boolean;
  try {
    ({ authUserId, email, alreadyExisted } = await createAuthUser(
      parsed.data.identifier,
      tempPassword,
      parsed.data.full_name,
    ));
  } catch {
    return { error: "Không tạo được tài khoản đăng nhập (thử tên đăng nhập khác)." };
  }

  const supabase = await createSupabaseServerClient();
  const { data: profile, error } = await supabase
    .from("profiles")
    .upsert(
      {
        auth_user_id: authUserId,
        role: "PARENT",
        full_name: parsed.data.full_name,
        phone: parsed.data.phone,
        email,
        active: true,
      },
      { onConflict: "auth_user_id" },
    )
    .select("id")
    .single();
  if (error || !profile) return { error: "Tạo hồ sơ thất bại. " + (error?.message ?? "") };

  await ensureGuardianForProfile(supabase, profile.id, parsed.data.full_name, parsed.data.phone);

  await logAudit(supabase, admin, {
    action: "CREATE_PARENT",
    entity: "profiles",
    detail: parsed.data.full_name,
  });
  revalidatePath("/admin/parents");

  if (alreadyExisted) {
    return { error: "Tài khoản đăng nhập đã tồn tại — đã cập nhật hồ sơ (không đổi mật khẩu)." };
  }
  return { ok: true, tempPassword };
}

export async function linkStudent(formData: FormData): Promise<void> {
  const admin = await requireAdmin();
  const parentId = z.string().uuid().safeParse(formData.get("parent_id"));
  const studentId = z.string().uuid().safeParse(formData.get("student_id"));
  if (!parentId.success || !studentId.success) return;

  const supabase = await createSupabaseServerClient();
  const { data: prof } = await supabase
    .from("profiles")
    .select("full_name, phone")
    .eq("id", parentId.data)
    .maybeSingle();
  const guardianId = await ensureGuardianForProfile(
    supabase,
    parentId.data,
    prof?.full_name ?? "(phụ huynh)",
    prof?.phone ?? null,
  );
  if (!guardianId) return;

  await supabase
    .from("student_guardians")
    .upsert(
      { student_id: studentId.data, guardian_id: guardianId },
      { onConflict: "student_id,guardian_id" },
    );
  await logAudit(supabase, admin, {
    action: "LINK_PARENT_STUDENT",
    entity: "student_guardians",
    detail: `${parentId.data} ↔ ${studentId.data}`,
  });
  revalidatePath("/admin/parents");
}

export async function unlinkStudent(formData: FormData): Promise<void> {
  const admin = await requireAdmin();
  const parentId = z.string().uuid().safeParse(formData.get("parent_id"));
  const studentId = z.string().uuid().safeParse(formData.get("student_id"));
  if (!parentId.success || !studentId.success) return;

  const supabase = await createSupabaseServerClient();
  const { data: guardian } = await supabase
    .from("guardians")
    .select("id")
    .eq("profile_id", parentId.data)
    .maybeSingle();
  if (!guardian) return;

  await supabase
    .from("student_guardians")
    .delete()
    .eq("student_id", studentId.data)
    .eq("guardian_id", guardian.id);
  await logAudit(supabase, admin, {
    action: "UNLINK_PARENT_STUDENT",
    entity: "student_guardians",
    detail: `${parentId.data} ✕ ${studentId.data}`,
  });
  revalidatePath("/admin/parents");
}
