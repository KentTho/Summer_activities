/**
 * Data-access mẫu báo cáo DOCX (server-only, qua RLS).
 * RLS tpl_select: Admin thấy tất cả; Bí thư/Chi Đoàn chỉ thấy mẫu đang bật (active).
 */
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Tables } from "@/lib/types";

export type TemplateRow = Tables<"export_templates">;

export interface TemplateWithFile extends TemplateRow {
  /** true nếu đã có tệp binary đính kèm (document_id + uploaded_documents). */
  hasFile: boolean;
  sizeBytes: number | null;
}

/** Danh sách mẫu (Admin) kèm thông tin tệp đính kèm để hiển thị/tải về. */
export async function listTemplates(): Promise<TemplateWithFile[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("export_templates")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  const rows = data ?? [];

  const docIds = rows.map((r) => r.document_id).filter((v): v is string => !!v);
  const sizeById = new Map<string, number | null>();
  if (docIds.length > 0) {
    const { data: docs } = await supabase
      .from("uploaded_documents")
      .select("id, size_bytes")
      .in("id", docIds);
    for (const d of docs ?? []) sizeById.set(d.id, d.size_bytes);
  }

  return rows.map((r) => ({
    ...r,
    hasFile: Boolean(r.document_id && sizeById.has(r.document_id)),
    sizeBytes: r.document_id ? sizeById.get(r.document_id) ?? null : null,
  }));
}

/** Chỉ mẫu đang bật (dùng cho cổng Bí thư — RLS đã lọc, thêm điều kiện cho rõ). */
export async function listActiveTemplates(): Promise<TemplateRow[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("export_templates")
    .select("*")
    .eq("active", true)
    .order("name");
  if (error) throw error;
  return data ?? [];
}
