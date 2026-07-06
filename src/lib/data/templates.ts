/**
 * Data-access mẫu báo cáo DOCX (server-only, qua RLS).
 * RLS tpl_select: Admin thấy tất cả; Bí thư/Chi Đoàn chỉ thấy mẫu đang bật (active).
 */
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Tables } from "@/lib/types";

export type TemplateRow = Tables<"export_templates">;

export async function listTemplates(): Promise<TemplateRow[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("export_templates")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
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
