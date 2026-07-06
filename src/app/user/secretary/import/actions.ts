"use server";

/**
 * Import staging cho Bí thư — đi qua RLS (server client, KHÔNG service role).
 * Quy trình: tạo lô nháp → nhập/sửa dòng nháp (họ tên / ngày sinh / SĐT phụ huynh)
 * → XÁC NHẬN thì mới tạo học sinh thật. KHÔNG auto-import khi chưa xác nhận.
 */
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth/session";
import { checkOcrUploadFile } from "@/lib/security";
import { extractStudentsFromImage, hasOcrConfigured } from "@/lib/ocr";

export interface ImportActionState {
  error?: string;
  ok?: boolean;
  /** Số dòng OCR vừa tạo (chỉ dùng cho action OCR). */
  count?: number;
}

const IMPORT_PATH = "/user/secretary/import";

const rowSchema = z.object({
  full_name: z.string().trim().max(120).optional().default(""),
  birth_date: z
    .string()
    .trim()
    .regex(/^\d{4}-\d{2}-\d{2}$/u, "Ngày sinh phải dạng YYYY-MM-DD.")
    .or(z.literal(""))
    .optional()
    .default(""),
  guardian_phone: z.string().trim().max(20).optional().default(""),
  guardian_name: z.string().trim().max(120).optional().default(""),
  school: z.string().trim().max(150).optional().default(""),
});

function readRow(formData: FormData) {
  return rowSchema.safeParse({
    full_name: formData.get("full_name") ?? "",
    birth_date: formData.get("birth_date") ?? "",
    guardian_phone: formData.get("guardian_phone") ?? "",
    guardian_name: formData.get("guardian_name") ?? "",
    school: formData.get("school") ?? "",
  });
}

/** Tạo lô import nháp; chuyển sang trang chi tiết để nhập dòng. */
export async function createBatch(
  _prev: ImportActionState,
  formData: FormData,
): Promise<ImportActionState> {
  const fileName = String(formData.get("file_name") ?? "").trim() || "Nhập tay";
  const neighborhoodId = z
    .string()
    .uuid("Chưa chọn Khu phố hợp lệ.")
    .safeParse(formData.get("neighborhood_id"));
  if (!neighborhoodId.success) return { error: "Chưa chọn Khu phố cho lô import." };

  const profile = await getCurrentProfile();
  if (!profile) return { error: "Phiên đăng nhập không hợp lệ." };

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("import_batches")
    .insert({
      file_name: fileName,
      source: "MANUAL",
      status: "DRAFT",
      neighborhood_id: neighborhoodId.data,
      created_by: profile.profileId,
    })
    .select("id")
    .single();

  if (error || !data) {
    return { error: "Không thể tạo lô import. " + (error?.message ?? "") };
  }

  redirect(`${IMPORT_PATH}/${data.id}`);
}

export async function addRow(
  _prev: ImportActionState,
  formData: FormData,
): Promise<ImportActionState> {
  const batchId = z.string().uuid().safeParse(formData.get("batch_id"));
  if (!batchId.success) return { error: "Thiếu mã lô." };

  const parsed = readRow(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ." };
  }
  if (!parsed.data.full_name) return { error: "Cần ít nhất Họ tên cho dòng nháp." };

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("import_batch_rows").insert({
    batch_id: batchId.data,
    raw_data: parsed.data,
    reviewed: true,
  });
  if (error) return { error: "Không thể thêm dòng. " + error.message };

  revalidatePath(`${IMPORT_PATH}/${batchId.data}`);
  return { ok: true };
}

/**
 * OCR: nhận ảnh/PDF giấy tờ, chạy OCR **server-side**, tách thành dòng nháp
 * (reviewed=false) để Bí thư kiểm tra/sửa tay. KHÔNG tạo học sinh ở bước này.
 * API key OCR chỉ ở server (env) — không bao giờ ra client.
 */
export async function ocrExtractRows(
  _prev: ImportActionState,
  formData: FormData,
): Promise<ImportActionState> {
  const batchId = z.string().uuid().safeParse(formData.get("batch_id"));
  if (!batchId.success) return { error: "Thiếu mã lô." };

  const profile = await getCurrentProfile();
  if (!profile) return { error: "Phiên đăng nhập không hợp lệ." };

  const raw = formData.get("file");
  const file = raw instanceof File ? raw : null;
  const check = checkOcrUploadFile(file);
  if (!check.ok || !file) return { error: check.error ?? "Tệp không hợp lệ." };

  if (!hasOcrConfigured()) {
    return {
      error:
        "OCR chưa cấu hình (thiếu OCR_SPACE_API_KEY, server-only). Bạn vẫn có thể nhập tay bên dưới.",
    };
  }

  let extracted;
  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    extracted = await extractStudentsFromImage({
      base64: buffer.toString("base64"),
      mimeType: file.type,
      fileName: file.name,
    });
  } catch (err) {
    return { error: (err as Error).message };
  }

  if (extracted.rows.length === 0) {
    return {
      error: "OCR không tách được dòng nào. Hãy thử ảnh rõ hơn hoặc nhập tay.",
    };
  }

  const supabase = await createSupabaseServerClient();
  const payload = extracted.rows.map((r) => ({
    batch_id: batchId.data,
    // Dòng OCR: chưa duyệt (reviewed=false) → phải kiểm tra/sửa tay trước khi confirm.
    raw_data: {
      full_name: r.full_name,
      birth_date: r.birth_date,
      guardian_phone: r.guardian_phone,
      source: "OCR",
    },
    reviewed: false,
  }));

  const { error } = await supabase.from("import_batch_rows").insert(payload);
  if (error) return { error: "Không thể lưu dòng OCR. " + error.message };

  // Đánh dấu lô có nguồn OCR (không chặn nếu RLS từ chối — chỉ là nhãn).
  await supabase.from("import_batches").update({ source: "OCR" }).eq("id", batchId.data);

  revalidatePath(`${IMPORT_PATH}/${batchId.data}`);
  return { ok: true, count: extracted.rows.length };
}

/**
 * Sửa một dòng nháp (kiểm tra/sửa kết quả OCR). Lưu xong đánh dấu reviewed=true
 * (đã người-duyệt). Chỉ sửa dòng chưa tạo học sinh.
 */
export async function updateRow(
  _prev: ImportActionState,
  formData: FormData,
): Promise<ImportActionState> {
  const rowId = z.string().uuid().safeParse(formData.get("row_id"));
  const batchId = z.string().uuid().safeParse(formData.get("batch_id"));
  if (!rowId.success || !batchId.success) return { error: "Thiếu mã dòng/lô." };

  const parsed = readRow(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ." };
  }
  if (!parsed.data.full_name) return { error: "Cần Họ tên trước khi lưu." };

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("import_batch_rows")
    .update({ raw_data: parsed.data, reviewed: true })
    .eq("id", rowId.data)
    .is("created_student_id", null);
  if (error) return { error: "Không thể cập nhật dòng. " + error.message };

  revalidatePath(`${IMPORT_PATH}/${batchId.data}`);
  return { ok: true };
}

export async function deleteRow(formData: FormData): Promise<void> {
  const rowId = z.string().uuid().safeParse(formData.get("row_id"));
  const batchId = String(formData.get("batch_id") ?? "");
  if (!rowId.success) return;

  const supabase = await createSupabaseServerClient();
  await supabase.from("import_batch_rows").delete().eq("id", rowId.data);
  revalidatePath(`${IMPORT_PATH}/${batchId}`);
}

/**
 * XÁC NHẬN lô: tạo học sinh thật từ các dòng nháp (có Họ tên) chưa tạo.
 * Gán Khu phố theo lô. Đánh dấu created_student_id + chuyển lô sang COMMITTED.
 */
export async function confirmBatch(formData: FormData): Promise<void> {
  const batchId = z.string().uuid().safeParse(formData.get("batch_id"));
  if (!batchId.success) return;

  const profile = await getCurrentProfile();
  if (!profile) return;

  const supabase = await createSupabaseServerClient();

  const { data: batch } = await supabase
    .from("import_batches")
    .select("id, neighborhood_id")
    .eq("id", batchId.data)
    .maybeSingle();
  if (!batch?.neighborhood_id) return;

  // CHỈ tạo học sinh từ dòng đã DUYỆT (reviewed=true). Dòng OCR chưa sửa/duyệt
  // (reviewed=false) bị bỏ qua — enforce "kiểm tra/sửa tay trước khi confirm".
  const { data: rows } = await supabase
    .from("import_batch_rows")
    .select("*")
    .eq("batch_id", batchId.data)
    .eq("reviewed", true)
    .is("created_student_id", null);

  for (const row of rows ?? []) {
    const d = (row.raw_data ?? {}) as Record<string, string>;
    const fullName = (d.full_name ?? "").trim();
    if (!fullName) continue;

    const { data: created, error } = await supabase
      .from("students")
      .insert({
        full_name: fullName,
        birth_date: d.birth_date ? d.birth_date : null,
        guardian_phone: d.guardian_phone ? d.guardian_phone : null,
        guardian_name: d.guardian_name ? d.guardian_name : null,
        school: d.school ? d.school : null,
        neighborhood_id: batch.neighborhood_id,
        created_by: profile.profileId,
      })
      .select("id")
      .single();

    if (!error && created) {
      await supabase
        .from("import_batch_rows")
        .update({ created_student_id: created.id })
        .eq("id", row.id);
    }
  }

  // Chỉ đóng lô (COMMITTED) khi KHÔNG còn dòng nào chờ (chưa tạo học sinh) — tránh
  // bỏ sót các dòng OCR chưa duyệt. Còn dòng chờ thì giữ DRAFT để tiếp tục duyệt.
  const { count: remaining } = await supabase
    .from("import_batch_rows")
    .select("id", { count: "exact", head: true })
    .eq("batch_id", batchId.data)
    .is("created_student_id", null);

  if (!remaining) {
    await supabase
      .from("import_batches")
      .update({ status: "COMMITTED" })
      .eq("id", batchId.data);
  }

  revalidatePath(`${IMPORT_PATH}/${batchId.data}`);
  revalidatePath("/user/secretary/students");
  redirect(`${IMPORT_PATH}/${batchId.data}`);
}
