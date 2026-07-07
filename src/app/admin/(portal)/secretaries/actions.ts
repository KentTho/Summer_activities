"use server";

/**
 * Server Actions quản lý tài khoản Bí thư/Chi Đoàn (role SECRETARY).
 * requireAdmin() BẮT BUỘC. Service role CHỈ để tạo auth user; hồ sơ/gán phụ trách
 * đi qua RLS server client (Admin có quyền qua policy is_admin()).
 */
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth/require-admin";
import { createAuthUser, generateTempPassword } from "@/lib/admin/accounts";
import { logAudit } from "@/lib/admin/audit";
import { STAFF_TITLES } from "@/modules/auth/domain/staff-title";
import type { AccountActionState } from "../account-actions";

const staffSchema = z.object({
  identifier: z.string().trim().min(3, "Tên đăng nhập/SĐT quá ngắn.").max(120),
  full_name: z.string().trim().min(2, "Họ tên quá ngắn.").max(120),
  staff_title: z.enum(STAFF_TITLES),
  phone: z
    .string()
    .trim()
    .max(20)
    .optional()
    .transform((v) => (v ? v : null)),
});

export async function createStaff(
  _prev: AccountActionState,
  formData: FormData,
): Promise<AccountActionState> {
  const admin = await requireAdmin();
  const parsed = staffSchema.safeParse({
    identifier: formData.get("identifier"),
    full_name: formData.get("full_name"),
    staff_title: formData.get("staff_title"),
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
  const { error } = await supabase.from("profiles").upsert(
    {
      auth_user_id: authUserId,
      role: "SECRETARY",
      staff_title: parsed.data.staff_title,
      full_name: parsed.data.full_name,
      phone: parsed.data.phone,
      email,
      active: true,
    },
    { onConflict: "auth_user_id" },
  );
  if (error) return { error: "Tạo hồ sơ thất bại. " + error.message };

  await logAudit(supabase, admin, {
    action: "CREATE_STAFF",
    entity: "profiles",
    detail: `${parsed.data.staff_title}: ${parsed.data.full_name}`,
  });
  revalidatePath("/admin/secretaries");

  if (alreadyExisted) {
    return { error: "Tài khoản đăng nhập đã tồn tại — đã cập nhật hồ sơ (không đổi mật khẩu)." };
  }
  return { ok: true, tempPassword };
}

const assignmentRoleSchema = z.enum(["PRIMARY", "COORDINATING"]);

function revalidateAssignments(): void {
  revalidatePath("/admin/secretaries");
  revalidatePath("/admin/assignments");
  revalidatePath("/admin/neighborhoods");
}

/**
 * Hạ Phụ trách chính hiện tại của một Khu phố xuống Phụ trách chung (nếu có,
 * và không phải chính người đang được nâng). Giữ ràng buộc "tối đa 1 chính".
 */
async function demoteExistingPrimary(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  neighborhoodId: string,
  exceptSecretaryId?: string,
): Promise<void> {
  let query = supabase
    .from("secretary_neighborhoods")
    .update({ assignment_role: "COORDINATING" })
    .eq("neighborhood_id", neighborhoodId)
    .eq("assignment_role", "PRIMARY");
  if (exceptSecretaryId) query = query.neq("secretary_id", exceptSecretaryId);
  await query;
}

export async function assignNeighborhood(formData: FormData): Promise<void> {
  const admin = await requireAdmin();
  const secretaryId = z.string().uuid().safeParse(formData.get("secretary_id"));
  const neighborhoodId = z.string().uuid().safeParse(formData.get("neighborhood_id"));
  const role = assignmentRoleSchema.safeParse(formData.get("assignment_role") ?? "COORDINATING");
  if (!secretaryId.success || !neighborhoodId.success || !role.success) return;

  const supabase = await createSupabaseServerClient();
  // Chỉ 1 Phụ trách chính/Khu phố: hạ người cũ trước khi nâng người mới.
  if (role.data === "PRIMARY") {
    await demoteExistingPrimary(supabase, neighborhoodId.data, secretaryId.data);
  }
  await supabase.from("secretary_neighborhoods").upsert(
    {
      secretary_id: secretaryId.data,
      neighborhood_id: neighborhoodId.data,
      assignment_role: role.data,
    },
    { onConflict: "secretary_id,neighborhood_id" },
  );
  await logAudit(supabase, admin, {
    action: "ASSIGN_NEIGHBORHOOD",
    entity: "secretary_neighborhoods",
    detail: `${role.data} · ${secretaryId.data} ↔ ${neighborhoodId.data}`,
  });
  revalidateAssignments();
}

/** Đổi vai trò phụ trách (chính ↔ chung) của một phân công đã tồn tại. */
export async function setAssignmentRole(formData: FormData): Promise<void> {
  const admin = await requireAdmin();
  const secretaryId = z.string().uuid().safeParse(formData.get("secretary_id"));
  const neighborhoodId = z.string().uuid().safeParse(formData.get("neighborhood_id"));
  const role = assignmentRoleSchema.safeParse(formData.get("assignment_role"));
  if (!secretaryId.success || !neighborhoodId.success || !role.success) return;

  const supabase = await createSupabaseServerClient();
  if (role.data === "PRIMARY") {
    await demoteExistingPrimary(supabase, neighborhoodId.data, secretaryId.data);
  }
  await supabase
    .from("secretary_neighborhoods")
    .update({ assignment_role: role.data })
    .eq("secretary_id", secretaryId.data)
    .eq("neighborhood_id", neighborhoodId.data);
  await logAudit(supabase, admin, {
    action: "SET_ASSIGNMENT_ROLE",
    entity: "secretary_neighborhoods",
    detail: `${role.data} · ${secretaryId.data} ↔ ${neighborhoodId.data}`,
  });
  revalidateAssignments();
}

export async function unassignNeighborhood(formData: FormData): Promise<void> {
  const admin = await requireAdmin();
  const secretaryId = z.string().uuid().safeParse(formData.get("secretary_id"));
  const neighborhoodId = z.string().uuid().safeParse(formData.get("neighborhood_id"));
  if (!secretaryId.success || !neighborhoodId.success) return;

  const supabase = await createSupabaseServerClient();
  await supabase
    .from("secretary_neighborhoods")
    .delete()
    .eq("secretary_id", secretaryId.data)
    .eq("neighborhood_id", neighborhoodId.data);
  await logAudit(supabase, admin, {
    action: "UNASSIGN_NEIGHBORHOOD",
    entity: "secretary_neighborhoods",
    detail: `${secretaryId.data} ✕ ${neighborhoodId.data}`,
  });
  revalidateAssignments();
}
