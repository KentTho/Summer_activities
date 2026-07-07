/**
 * Điểm vào AI import (server-only). Gọi Gemini → validate JSON (Zod) → chuẩn hóa
 * → đánh dấu dòng cần kiểm tra tay. KHÔNG ghi thẳng vào `students`.
 * KHÔNG import từ client component. KHÔNG log ảnh/base64/PII/API key.
 */
import { z } from "zod";
import { callGeminiJson } from "./gemini";
import { computeNeedsReview, normalizeBirthDate, normalizeVnPhone } from "./normalize";
import type { AiDraftRow, AiExtractResult, AiImportInput } from "./types";

export { hasGeminiConfigured, isAiImportReady } from "@/lib/env";
export type { AiDraftRow, AiExtractResult, AiImportInput } from "./types";

/** Schema NGHIÊM NGẶT cho JSON Gemini trả về (trước chuẩn hóa). */
const geminiRowSchema = z.object({
  full_name: z.string().max(200).optional().default(""),
  birth_date: z.union([z.string(), z.null()]).optional().default(null),
  guardian_phone: z.union([z.string(), z.null()]).optional().default(""),
  confidence: z.coerce.number().min(0).max(1).optional().default(0.5),
  notes: z.string().max(500).optional().default(""),
});
const geminiResultSchema = z.object({
  rows: z.array(geminiRowSchema).max(200).optional().default([]),
  warnings: z.array(z.string().max(300)).max(50).optional().default([]),
});

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
    const birth_date = normalizeBirthDate(r.birth_date ?? null);
    const guardian_phone = normalizeVnPhone(r.guardian_phone ?? "");
    const confidence = r.confidence ?? 0.5;
    return {
      full_name,
      birth_date,
      guardian_phone,
      confidence,
      notes: (r.notes ?? "").trim(),
      needs_review: computeNeedsReview({ full_name, birth_date, guardian_phone, confidence }),
    };
  });

  return { rows, warnings: result.data.warnings };
}
