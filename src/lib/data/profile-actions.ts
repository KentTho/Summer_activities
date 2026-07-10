"use server";

/**
 * Server Action: người dùng tự cập nhật thông tin cá nhân AN TOÀN (10B).
 * CHỈ đổi họ tên + số điện thoại qua RPC `update_own_profile` (SECURITY DEFINER).
 * KHÔNG cho đổi role/active/staff_title/email/neighborhood. Ghi audit UPDATE_OWN_PROFILE.
 */
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth/session";
import { logAudit } from "@/lib/admin/audit";

export interface ProfileActionState {
  ok?: boolean;
  error?: string;
}

const schema = z.object({
  full_name: z.string().trim().min(2, "Họ tên quá ngắn.").max(120),
  phone: z
    .string()
    .trim()
    .max(20)
    .regex(/^[0-9+\s.-]*$/u, "Số điện thoại không hợp lệ.")
    .optional()
    .default(""),
});

const PROFILE_PATHS = ["/admin/profile", "/user/secretary/profile", "/user/parent/profile"];

export async function updateOwnProfile(
  _prev: ProfileActionState,
  formData: FormData,
): Promise<ProfileActionState> {
  const profile = await getCurrentProfile();
  if (!profile) return { error: "Phiên đăng nhập không hợp lệ." };

  const parsed = schema.safeParse({
    full_name: formData.get("full_name"),
    phone: formData.get("phone") ?? "",
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ." };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc("update_own_profile", {
    p_full_name: parsed.data.full_name,
    p_phone: parsed.data.phone,
  });
  if (error) return { error: "Không cập nhật được thông tin. Vui lòng thử lại." };

  // Audit: chỉ ghi việc "tự cập nhật hồ sơ", KHÔNG log giá trị/PII.
  await logAudit(supabase, profile, {
    action: "UPDATE_OWN_PROFILE",
    entity: "profiles",
    detail: `profile ${profile.profileId} tự cập nhật họ tên/SĐT`,
  });

  for (const p of PROFILE_PATHS) revalidatePath(p);
  return { ok: true };
}
