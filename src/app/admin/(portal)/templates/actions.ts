"use server";

/**
 * Server Actions quản lý mẫu báo cáo DOCX (nền tảng — chưa render DOCX thật).
 * requireAdmin() BẮT BUỘC. Chỉ chấp nhận tên tệp `.docx` (KHÔNG `.docm`/macro).
 * Render DOCX server-side + upload binary vào bucket private để Prompt 08B.
 */
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth/require-admin";
import { logAudit } from "@/lib/admin/audit";

export interface TemplateActionState {
  error?: string;
  ok?: boolean;
}

const createSchema = z
  .object({
    name: z.string().trim().min(2, "Tên mẫu quá ngắn.").max(150),
    file_name: z.string().trim().max(200).optional().default(""),
  })
  .refine(
    (v) => {
      if (!v.file_name) return true;
      const lower = v.file_name.toLowerCase();
      return lower.endsWith(".docx") && !lower.endsWith(".docm");
    },
    { message: "Tên tệp phải là .docx (không nhận .docm/macro).", path: ["file_name"] },
  );

export async function createTemplate(
  _prev: TemplateActionState,
  formData: FormData,
): Promise<TemplateActionState> {
  const admin = await requireAdmin();
  const parsed = createSchema.safeParse({
    name: formData.get("name"),
    file_name: formData.get("file_name") ?? "",
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ." };
  }

  // Ghi tham chiếu tên tệp .docx vào name (chưa có cột riêng / chưa lưu binary).
  const name = parsed.data.file_name
    ? `${parsed.data.name} (${parsed.data.file_name})`
    : parsed.data.name;

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("export_templates")
    .insert({ name, active: true, created_by: admin.profileId });
  if (error) return { error: "Không tạo được mẫu. " + error.message };

  await logAudit(supabase, admin, { action: "CREATE_TEMPLATE", entity: "export_templates", detail: name });
  revalidatePath("/admin/templates");
  return { ok: true };
}

export async function toggleTemplate(formData: FormData): Promise<void> {
  const admin = await requireAdmin();
  const id = z.string().uuid().safeParse(formData.get("template_id"));
  const active = String(formData.get("active")) === "true";
  if (!id.success) return;

  const supabase = await createSupabaseServerClient();
  await supabase.from("export_templates").update({ active }).eq("id", id.data);
  await logAudit(supabase, admin, {
    action: "TOGGLE_TEMPLATE",
    entity: "export_templates",
    detail: `${id.data} → ${active ? "bật" : "tắt"}`,
  });
  revalidatePath("/admin/templates");
}
