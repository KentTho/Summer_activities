/**
 * Điểm vào lớp OCR (server-only). Chọn provider theo env, gọi nhận dạng, rồi
 * chuẩn hóa text → dòng học sinh ứng viên. KHÔNG import từ client component.
 *
 * Ranh giới an toàn (xem docs/ocr-import.md, docs/ai-security-checklist.md):
 *  - API key chỉ ở server (env), không expose ra client.
 *  - OCR KHÔNG ghi thẳng vào `students`; chỉ tạo dòng nháp để duyệt tay.
 */
import { env, hasOcrConfigured } from "@/lib/env";
import { createOcrSpaceProvider } from "./ocrspace";
import { parseOcrText } from "./parse";
import type { OcrInput, OcrProvider, ParsedStudentRow } from "./types";

export { hasOcrConfigured } from "@/lib/env";
export type { OcrInput, OcrResult, ParsedStudentRow } from "./types";

/** Trả provider theo cấu hình, hoặc null nếu chưa cấu hình/không hỗ trợ. */
export function getOcrProvider(): OcrProvider | null {
  if (!hasOcrConfigured()) return null;
  if (env.ocrProvider === "ocrspace") return createOcrSpaceProvider();
  return null;
}

export interface OcrExtractOutput {
  provider: string;
  rawText: string;
  rows: ParsedStudentRow[];
}

/**
 * Nhận dạng ảnh/PDF rồi tách thành dòng ứng viên. Ném lỗi nếu chưa cấu hình
 * hoặc provider lỗi — action gọi sẽ chuyển thành thông báo thân thiện.
 */
export async function extractStudentsFromImage(
  input: OcrInput,
): Promise<OcrExtractOutput> {
  const provider = getOcrProvider();
  if (!provider) {
    throw new Error(
      "OCR chưa cấu hình. Thêm OCR_SPACE_API_KEY (server-only) vào .env.local rồi thử lại.",
    );
  }
  const { text, provider: name } = await provider.recognize(input);
  return { provider: name, rawText: text, rows: parseOcrText(text) };
}
