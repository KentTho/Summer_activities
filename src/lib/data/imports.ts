/**
 * Data-access import staging (server-only, qua RLS).
 * Lô import (import_batches) + dòng nháp (import_batch_rows.raw_data jsonb).
 * KHÔNG auto-import: chỉ khi Bí thư bấm xác nhận mới tạo học sinh thật.
 */
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Tables } from "@/lib/types";

export type ImportBatchRow = Tables<"import_batches">;
export type ImportRow = Tables<"import_batch_rows">;

/** Hình dạng dữ liệu nháp trong raw_data (3 trường quan trọng + phụ). */
export interface ImportRowData {
  full_name?: string;
  birth_date?: string;
  guardian_phone?: string;
  guardian_name?: string;
  school?: string;
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
