/**
 * Thử merge dữ liệu vào mẫu `.docx` upload; trả `null` để caller FALLBACK sang
 * DOCX tự sinh (08C) khi: không có template, mẫu không có placeholder, hoặc mẫu hỏng.
 *
 * Xác thực quyền dùng mẫu QUA RLS (client đăng nhập) trước khi đọc binary bằng
 * service role (xem `downloadTemplateByDocumentId`). Server-side only.
 */
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { downloadTemplateByDocumentId } from "@/lib/storage/templates";
import { mergeTemplate, type MergeValues } from "@/lib/docx/merge";

export async function tryTemplateMerge(
  templateId: string | null,
  values: MergeValues,
): Promise<Buffer | null> {
  if (!templateId) return null;

  // RLS: Bí thư chỉ thấy mẫu đang bật; Admin thấy tất cả. Không thấy ⇒ không dùng.
  const supabase = await createSupabaseServerClient();
  const { data: tpl } = await supabase
    .from("export_templates")
    .select("document_id, active")
    .eq("id", templateId)
    .maybeSingle();
  if (!tpl || !tpl.active || !tpl.document_id) return null;

  const templateBuf = await downloadTemplateByDocumentId(tpl.document_id);
  if (!templateBuf) return null;

  try {
    return mergeTemplate(templateBuf, values);
  } catch {
    // Mẫu hỏng/không đọc được → fallback DOCX tự sinh (không chặn người dùng).
    return null;
  }
}
