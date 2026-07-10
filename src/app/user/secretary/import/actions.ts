"use server";

/**
 * Import staging cho Bí thư — đi qua RLS (server client, KHÔNG service role).
 * Quy trình: tạo lô nháp → nhập/sửa dòng nháp (họ tên / ngày sinh / SĐT phụ huynh)
 * → XÁC NHẬN thì mới tạo học sinh thật. KHÔNG auto-import khi chưa xác nhận.
 */
import { randomUUID, createHash } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth/session";
import { checkAiImportFile } from "@/lib/security";
import { extractStudentDraftsFromImage, isAiImportReady } from "@/lib/ai-import";
import { env } from "@/lib/env";
import { logEvent, logError } from "@/lib/monitoring/server-log";
import { logAudit } from "@/lib/admin/audit";
import { consumeAiQuota } from "@/lib/data/ai-import-usage";
import { ROLES } from "@/modules/auth/domain/roles";
import {
  AI_IMPORT_BUCKET,
  ensureAiImportBucket,
  extForMime,
  uploadAiImportImage,
} from "@/lib/storage/ai-import";

export interface ImportActionState {
  error?: string;
  ok?: boolean;
  /** Số dòng AI vừa tạo (chỉ dùng cho action AI import). */
  count?: number;
  /** Cảnh báo chung từ AI (ảnh mờ…). */
  warnings?: string[];
}

const IMPORT_PATH = "/user/secretary/import";

const rowSchema = z.object({
  full_name: z.string().trim().max(120).optional().default(""),
  birth_year: z
    .string()
    .trim()
    .regex(/^\d{4}$/u, "Năm sinh phải là 4 chữ số.")
    .or(z.literal(""))
    .optional()
    .default(""),
  birth_date: z
    .string()
    .trim()
    .regex(/^\d{4}-\d{2}-\d{2}$/u, "Ngày sinh phải dạng YYYY-MM-DD.")
    .or(z.literal(""))
    .optional()
    .default(""),
  gender: z.enum(["MALE", "FEMALE", "OTHER", "UNKNOWN"]).or(z.literal("")).optional().default(""),
  signature_present: z.enum(["true", "false"]).or(z.literal("")).optional().default(""),
  signature_note: z.string().trim().max(200).optional().default(""),
  guardian_phone: z.string().trim().max(20).optional().default(""),
  guardian_name: z.string().trim().max(120).optional().default(""),
  school: z.string().trim().max(150).optional().default(""),
});

function readRow(formData: FormData) {
  return rowSchema.safeParse({
    full_name: formData.get("full_name") ?? "",
    birth_year: formData.get("birth_year") ?? "",
    birth_date: formData.get("birth_date") ?? "",
    gender: formData.get("gender") ?? "",
    signature_present: formData.get("signature_present") ?? "",
    signature_note: formData.get("signature_note") ?? "",
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
 * AI import: nhận ẢNH giấy tờ, gọi Gemini Vision **server-side**, tách thành dòng
 * nháp (reviewed=false) để Bí thư kiểm tra/sửa tay. KHÔNG tạo học sinh ở bước này.
 * Gemini key chỉ ở server (env) — không bao giờ ra client. KHÔNG log ảnh/PII/key.
 */
export async function aiExtractRows(
  _prev: ImportActionState,
  formData: FormData,
): Promise<ImportActionState> {
  const batchId = z.string().uuid().safeParse(formData.get("batch_id"));
  if (!batchId.success) return { error: "Thiếu mã lô." };

  const profile = await getCurrentProfile();
  if (!profile) return { error: "Phiên đăng nhập không hợp lệ." };
  if (profile.role !== ROLES.SECRETARY && profile.role !== ROLES.ADMIN) {
    return { error: "Bạn không có quyền dùng AI import." };
  }

  const raw = formData.get("file");
  const file = raw instanceof File ? raw : null;
  const check = checkAiImportFile(file, env.aiImportMaxFileMb * 1024 * 1024);
  if (!check.ok || !file) return { error: check.error ?? "Tệp không hợp lệ." };

  if (!isAiImportReady()) {
    return {
      error:
        "Tính năng AI đọc ảnh chưa sẵn sàng (thiếu cấu hình). Bạn vẫn có thể nhập tay bên dưới.",
    };
  }

  const supabase = await createSupabaseServerClient();
  const { data: batch, error: batchError } = await supabase
    .from("import_batches")
    .select("id, status, created_by")
    .eq("id", batchId.data)
    .eq("created_by", profile.profileId)
    .maybeSingle();
  if (batchError || !batch) {
    return { error: "Không tìm thấy lô import hợp lệ hoặc bạn không có quyền với lô này." };
  }
  if (batch.status === "COMMITTED") {
    return { error: "Lô import đã ghi nhận, không thể dùng AI để thêm dòng mới." };
  }

  // (D) Rate-limit theo user/ngày TRƯỚC khi gọi Gemini/upload — bảo vệ quota.
  const quota = await consumeAiQuota();
  if (!quota.allowed) {
    logEvent("ai_import_rate_limited", { limit: quota.limit });
    return {
      error: `Đã đạt giới hạn AI hôm nay (${quota.limit} lượt). Vui lòng nhập tay hoặc thử lại ngày mai.`,
    };
  }

  const bytes = new Uint8Array(await file.arrayBuffer());

  // (E) Lưu ảnh gốc vào Storage PRIVATE + metadata (đối chiếu khi AI đọc sai).
  // Lỗi upload KHÔNG chặn import: vẫn thử Gemini + cho nhập tay.
  let documentId: string | null = null;
  try {
    const today = new Date().toISOString().slice(0, 10);
    const path = `${profile.profileId}/${today}/${batchId.data}/${randomUUID()}.${extForMime(file.type)}`;
    await ensureAiImportBucket(env.aiImportMaxFileMb * 1024 * 1024);
    await uploadAiImportImage(path, bytes, file.type);
    const sha256 = createHash("sha256").update(bytes).digest("hex");
    const { data: doc } = await supabase
      .from("uploaded_documents")
      .insert({
        bucket: AI_IMPORT_BUCKET,
        path,
        mime_type: file.type,
        size_bytes: bytes.length,
        sha256,
        uploaded_by: profile.profileId,
        import_batch_id: batchId.data,
      })
      .select("id")
      .single();
    documentId = doc?.id ?? null;
    logEvent("ai_import_uploaded", { batch: batchId.data, doc: documentId, sizeKb: Math.round(file.size / 1024) });
  } catch (err) {
    // Không lộ path (chứa profile id); chỉ ghi mã lô + mime.
    logError("ai_import_upload_failed", err, { batch: batchId.data, mime: file.type });
  }

  // (F) Gọi Gemini. Fail sau upload ⇒ ảnh vẫn còn để đối chiếu; user nhập tay được.
  let extracted;
  try {
    extracted = await extractStudentDraftsFromImage({
      base64: Buffer.from(bytes).toString("base64"),
      mimeType: file.type,
      fileName: file.name,
    });
  } catch (err) {
    logError("ai_import_failed", err, { batch: batchId.data, mime: file.type, sizeKb: Math.round(file.size / 1024) });
    return { error: (err as Error).message };
  }

  if (extracted.rows.length === 0) {
    return {
      error: extracted.warnings[0] ?? "AI không đọc được dòng nào. Hãy thử ảnh rõ hơn hoặc nhập tay.",
      warnings: extracted.warnings,
    };
  }

  const payload = extracted.rows.map((r) => ({
    batch_id: batchId.data,
    // Dòng AI: chưa duyệt (reviewed=false) → phải kiểm tra/sửa tay trước khi confirm.
    raw_data: {
      full_name: r.full_name,
      birth_year: r.birth_year ? String(r.birth_year) : "",
      birth_date: r.birth_date ?? "",
      gender: r.gender ?? "",
      signature_present: r.signature_present === null ? "" : String(r.signature_present),
      signature_note: r.signature_note,
      guardian_phone: r.guardian_phone,
      // Nguồn NGHIỆP VỤ của dòng nháp = "AI" (đồng bộ với import_batches.source='AI').
      // Provider kỹ thuật là Gemini; nghiệp vụ chỉ quan tâm "do AI đọc" (09D).
      source: "AI",
      confidence: r.confidence,
      needs_review: r.needs_review,
      notes: r.notes,
    },
    reviewed: false,
  }));

  const { error } = await supabase.from("import_batch_rows").insert(payload);
  if (error) return { error: "Không thể lưu dòng AI. " + error.message };

  // Đánh dấu nguồn lô là 'AI' (enum mới ở 09C; 'OCR' cũ giữ cho dữ liệu lịch sử).
  await supabase.from("import_batches").update({ source: "AI" }).eq("id", batchId.data);

  // Audit + log an toàn: chỉ số lượng + mã lô/tài liệu, KHÔNG nội dung học sinh.
  await logAudit(supabase, profile, {
    action: "AI_IMPORT",
    entity: "import_batch_rows",
    detail: `Gemini đọc ảnh → ${extracted.rows.length} dòng nháp (lô ${batchId.data}${documentId ? `, ảnh ${documentId}` : ""})`,
  });
  logEvent("ai_import_ok", { batch: batchId.data, rows: extracted.rows.length, used: quota.used, mime: file.type });

  revalidatePath(`${IMPORT_PATH}/${batchId.data}`);
  return { ok: true, count: extracted.rows.length, warnings: extracted.warnings };
}

/**
 * Sửa một dòng nháp (kiểm tra/sửa kết quả AI). Lưu xong đánh dấu reviewed=true
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
    .eq("batch_id", batchId.data)
    .is("created_student_id", null);
  if (error) return { error: "Không thể cập nhật dòng. " + error.message };

  revalidatePath(`${IMPORT_PATH}/${batchId.data}`);
  return { ok: true };
}

export async function deleteRow(formData: FormData): Promise<void> {
  const rowId = z.string().uuid().safeParse(formData.get("row_id"));
  const batchId = z.string().uuid().safeParse(formData.get("batch_id"));
  if (!rowId.success || !batchId.success) return;

  const supabase = await createSupabaseServerClient();
  await supabase
    .from("import_batch_rows")
    .delete()
    .eq("id", rowId.data)
    .eq("batch_id", batchId.data);
  revalidatePath(`${IMPORT_PATH}/${batchId.data}`);
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

  // CHỈ tạo học sinh từ dòng đã DUYỆT (reviewed=true). Dòng AI chưa sửa/duyệt
  // (reviewed=false) bị bỏ qua — enforce "kiểm tra/sửa tay trước khi confirm".
  const { data: rows } = await supabase
    .from("import_batch_rows")
    .select("*")
    .eq("batch_id", batchId.data)
    .eq("reviewed", true)
    .is("created_student_id", null);

  let createdCount = 0;
  for (const row of rows ?? []) {
    const d = (row.raw_data ?? {}) as Record<string, string>;
    const fullName = (d.full_name ?? "").trim();
    if (!fullName) continue;

    // Field mới (10B): năm sinh/giới tính/chữ ký — chỉ điền khi hợp lệ, KHÔNG bịa.
    const birthYear = /^\d{4}$/.test(d.birth_year ?? "") ? Number(d.birth_year) : null;
    const gender = ["MALE", "FEMALE", "OTHER", "UNKNOWN"].includes(d.gender ?? "") ? d.gender : null;
    const signaturePresent =
      d.signature_present === "true" ? true : d.signature_present === "false" ? false : null;

    const { data: created, error } = await supabase
      .from("students")
      .insert({
        full_name: fullName,
        birth_year: birthYear,
        birth_date: d.birth_date ? d.birth_date : null,
        gender,
        signature_present: signaturePresent,
        signature_note: d.signature_note ? d.signature_note : null,
        guardian_phone: d.guardian_phone ? d.guardian_phone : null,
        guardian_name: d.guardian_name ? d.guardian_name : null,
        school: d.school ? d.school : null,
        neighborhood_id: batch.neighborhood_id,
        created_by: profile.profileId,
      })
      .select("id")
      .single();

    if (!error && created) {
      createdCount += 1;
      await supabase
        .from("import_batch_rows")
        .update({ created_student_id: created.id })
        .eq("id", row.id);
    }
  }

  if (createdCount > 0) {
    // Audit: chỉ số lượng + mã lô, KHÔNG tên/PII học sinh.
    await logAudit(supabase, profile, {
      action: "CONFIRM_AI_IMPORT",
      entity: "students",
      detail: `lô ${batchId.data} → tạo ${createdCount} học sinh từ dòng đã duyệt`,
    });
  }

  // Chỉ đóng lô (COMMITTED) khi KHÔNG còn dòng nào chờ (chưa tạo học sinh) — tránh
  // bỏ sót các dòng AI chưa duyệt. Còn dòng chờ thì giữ DRAFT để tiếp tục duyệt.
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
