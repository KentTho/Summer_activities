/**
 * Data-access import staging (server-only, qua RLS).
 * Lô import (import_batches) + dòng nháp (import_batch_rows.raw_data jsonb).
 * KHÔNG auto-import: chỉ khi Bí thư bấm xác nhận mới tạo học sinh thật.
 */
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Tables } from "@/lib/types";

export type ImportBatchRow = Tables<"import_batches">;
export type ImportRow = Tables<"import_batch_rows">;

/** Hình dạng dữ liệu nháp trong raw_data (trường quan trọng + mở rộng 10B). */
export interface ImportRowData {
  full_name?: string;
  birth_year?: string;
  birth_date?: string;
  gender?: string;
  signature_present?: string; // "true" | "false" | ""
  signature_note?: string;
  guardian_phone?: string;
  guardian_name?: string;
  school?: string;
  /** Metadata AI (nếu dòng từ AI đọc ảnh). */
  confidence?: number;
  needs_review?: boolean;
}

export function rowData(row: ImportRow): ImportRowData {
  return (row.raw_data ?? {}) as ImportRowData;
}

export async function listImportBatches(): Promise<ImportBatchRow[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("import_batches")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function getImportBatch(id: string): Promise<ImportBatchRow | null> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("import_batches")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export interface BatchImage {
  id: string;
  sizeBytes: number | null;
  createdAt: string;
}

/**
 * Ảnh gốc AI import đã lưu riêng tư cho một lô (đối chiếu khi AI đọc sai).
 * RLS: chỉ người upload (uploaded_by) hoặc Admin đọc được. KHÔNG trả path/URL.
 */
export async function listBatchImages(batchId: string): Promise<BatchImage[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("uploaded_documents")
    .select("id, size_bytes, created_at")
    .eq("import_batch_id", batchId)
    .order("created_at", { ascending: false });
  if (error) return [];
  return (data ?? []).map((d) => ({ id: d.id, sizeBytes: d.size_bytes, createdAt: d.created_at }));
}

export async function listImportRows(batchId: string): Promise<ImportRow[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("import_batch_rows")
    .select("*")
    .eq("batch_id", batchId)
    .order("created_at");
  if (error) throw error;
  return data ?? [];
}
