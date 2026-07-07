"use server";

/**
 * Server Actions quản lý mẫu báo cáo DOCX — upload BINARY thật vào Storage private.
 * requireAdmin() BẮT BUỘC trước mọi thao tác (điều kiện dùng service role cho Storage).
 * Chỉ nhận `.docx` (chặn `.docm`/macro) — kiểm tra đuôi + mime + magic bytes + quét macro.
 * Metadata ghi qua RLS (uploaded_documents/export_templates). KHÔNG log dữ liệu nhạy cảm.
 */
import { randomUUID, createHash } from "node:crypto";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth/require-admin";
import { logAudit } from "@/lib/admin/audit";
import { checkTemplateUploadFile } from "@/lib/security";
import { DOCX_MIME } from "@/lib/docx/document";
import {
  TEMPLATE_BUCKET,
  ensureTemplateBucket,
  uploadTemplateBinary,
} from "@/lib/storage/templates";

export interface TemplateActionState {
  error?: string;
  ok?: boolean;
}

const nameSchema = z.string().trim().min(2, "Tên mẫu quá ngắn.").max(150);

export async function createTemplate(
  _prev: TemplateActionState,
  formData: FormData,
): Promise<TemplateActionState> {
  const admin = await requireAdmin();

  const parsedName = nameSchema.safeParse(formData.get("name"));
  if (!parsedName.success) {
    return { error: parsedName.error.issues[0]?.message ?? "Tên mẫu không hợp lệ." };
  }

  const raw = formData.get("file");
  const file = raw instanceof File ? raw : null;
  const bytes = file ? new Uint8Array(await file.arrayBuffer()) : null;
  const check = checkTemplateUploadFile(file, bytes);
  if (!check.ok || !file || !bytes) {
    return { error: check.error ?? "Tệp mẫu không hợp lệ." };
  }

  // Tải binary lên Storage private (service role — sau requireAdmin).
  const path = `${randomUUID()}.docx`;
  try {
    await ensureTemplateBucket();
    await uploadTemplateBinary(path, bytes, DOCX_MIME);
  } catch (err) {
    return { error: "Không tải được tệp lên kho lưu trữ. " + (err as Error).message };
  }

  const sha256 = createHash("sha256").update(bytes).digest("hex");
  const supabase = await createSupabaseServerClient();

  // Metadata tệp (qua RLS — doc_insert cho is_admin()).
  const { data: doc, error: docErr } = await supabase
    .from("uploaded_documents")
    .insert({
      bucket: TEMPLATE_BUCKET,
      path,
      mime_type: DOCX_MIME,
      size_bytes: bytes.length,
      sha256,
      uploaded_by: admin.profileId,
    })
    .select("id")
    .single();
  if (docErr || !doc) {
    return { error: "Không lưu được thông tin tệp. " + (docErr?.message ?? "") };
  }

  const { error: tplErr } = await supabase.from("export_templates").insert({
    name: parsedName.data,
    document_id: doc.id,
    active: true,
    created_by: admin.profileId,
  });
  if (tplErr) return { error: "Không tạo được mẫu. " + tplErr.message };

  await logAudit(supabase, admin, {
    action: "CREATE_TEMPLATE",
    entity: "export_templates",
    detail: `${parsedName.data} (${(bytes.length / 1024).toFixed(0)}KB)`,
  });
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
