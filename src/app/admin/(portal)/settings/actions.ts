"use server";

/**
 * Lưu cấu hình hệ thống an toàn (single row `system_settings`).
 * requireAdmin() BẮT BUỘC. Chỉ ghi các trường WHITELIST — KHÔNG nhận CSS/JS/HTML
 * tùy ý (spec §7). Màu chủ đạo phải là mã hex hợp lệ. Ghi audit mọi thay đổi.
 */
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth/require-admin";
import { logAudit } from "@/lib/admin/audit";
import { isSafeHexColor } from "@/lib/security";

export interface SettingsActionState {
  error?: string;
  ok?: boolean;
}

const schema = z.object({
  system_name: z.string().trim().min(2, "Tên hệ thống quá ngắn.").max(150),
  primary_color: z
    .string()
    .trim()
    .max(7)
    .optional()
    .default("")
    .refine((v) => v === "" || isSafeHexColor(v), {
      message: "Màu chủ đạo phải là mã hex hợp lệ (vd #4f46e5).",
    }),
  public_footer_text: z.string().trim().max(300).optional().default(""),
});

export async function saveSettings(
  _prev: SettingsActionState,
  formData: FormData,
): Promise<SettingsActionState> {
  const admin = await requireAdmin();

  const parsed = schema.safeParse({
    system_name: formData.get("system_name"),
    primary_color: formData.get("primary_color") ?? "",
    public_footer_text: formData.get("public_footer_text") ?? "",
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ." };
  }

  const supabase = await createSupabaseServerClient();
  // Single-row (id=true). Upsert để tạo lần đầu hoặc cập nhật — chỉ field whitelist.
  const { error } = await supabase.from("system_settings").upsert(
    {
      id: true,
      system_name: parsed.data.system_name,
      primary_color: parsed.data.primary_color || null,
      public_footer_text: parsed.data.public_footer_text || null,
      updated_by: admin.profileId,
    },
    { onConflict: "id" },
  );
  if (error) return { error: "Không lưu được cấu hình. " + error.message };

  await logAudit(supabase, admin, {
    action: "UPDATE_SETTINGS",
    entity: "system_settings",
    detail: `Tên: ${parsed.data.system_name}`,
  });
  revalidatePath("/admin/settings");
  return { ok: true };
}
