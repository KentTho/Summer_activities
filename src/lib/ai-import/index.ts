/**
 * Điểm vào AI import (server-only). Gọi Gemini → validate JSON (Zod) → chuẩn hóa
 * → đánh dấu dòng cần kiểm tra tay. KHÔNG ghi thẳng vào `students`.
 * KHÔNG import từ client component. KHÔNG log ảnh/base64/PII/API key.
 */
import "server-only";

import { z } from "zod";
import { callGeminiJson } from "./gemini";
import {
  computeNeedsReview,
  normalizeBirthDate,
  normalizeBirthYear,
  normalizeGender,
  normalizeSignaturePresent,
  normalizeVnPhone,
} from "./normalize";
import type { AiDraftRow, AiExtractResult, AiImportInput } from "./types";

export { hasGeminiConfigured, isAiImportReady } from "@/lib/env";
export type { AiDraftRow, AiExtractResult, AiImportInput } from "./types";

/** Schema NGHIÊM NGẶT cho JSON Gemini trả về (trước chuẩn hóa). Chấp nhận field mới; giá trị lạ → chuẩn hóa sau. */
const geminiRowSchema = z.object({
  full_name: z.string().max(200).optional().default(""),
  birth_year: z.union([z.number(), z.string(), z.null()]).optional().default(null),
  birth_date: z.union([z.string(), z.null()]).optional().default(null),
  gender: z.union([z.string(), z.null()]).optional().default(null),
  guardian_phone: z.union([z.string(), z.null()]).optional().default(""),
  signature_present: z.union([z.boolean(), z.string(), z.null()]).optional().default(null),
  signature_note: z.union([z.string(), z.null()]).optional().default(""),
  confidence: z.coerce.number().min(0).max(1).optional().default(0.5),
  notes: z.string().max(500).optional().default(""),
}).strict();
const geminiResultSchema = z.object({
  rows: z.array(geminiRowSchema).max(200).optional().default([]),
  warnings: z.array(z.string().max(300)).max(50).optional().default([]),
}).strict();

/**
 * Trích xuất dòng học sinh nháp từ ảnh bằng Gemini. Ném lỗi thân thiện khi chưa
 * cấu hình / lỗi dịch vụ; nơi gọi chuyển thành thông báo và giữ nhập tay.
 */
export async function extractStudentDraftsFromImage(
  input: AiImportInput,
): Promise<AiExtractResult> {
  const rawJson = await callGeminiJson(input);

  let parsed: unknown;
  try {
    parsed = JSON.parse(rawJson);
  } catch {
    throw new Error("AI trả về dữ liệu không hợp lệ. Hãy thử lại hoặc nhập tay.");
  }

  const result = geminiResultSchema.safeParse(parsed);
  if (!result.success) {
    throw new Error("AI trả về dữ liệu sai định dạng. Hãy thử lại hoặc nhập tay.");
  }

  const rows: AiDraftRow[] = result.data.rows.map((r) => {
    const full_name = (r.full_name ?? "").trim();
    const birth_year = normalizeBirthYear(r.birth_year);
    const birth_date = normalizeBirthDate(r.birth_date ?? null);
    const gender = normalizeGender(r.gender);
    const guardian_phone = normalizeVnPhone(r.guardian_phone ?? "");
    const signature_present = normalizeSignaturePresent(r.signature_present);
    const confidence = r.confidence ?? 0.5;
    return {
      full_name,
      birth_year,
      birth_date,
      gender,
      guardian_phone,
      signature_present,
      signature_note: (r.signature_note ?? "").trim(),
      confidence,
      notes: (r.notes ?? "").trim(),
      needs_review: computeNeedsReview({ full_name, birth_year, birth_date, guardian_phone, confidence }),
    };
  });

  return { rows, warnings: result.data.warnings };
}
