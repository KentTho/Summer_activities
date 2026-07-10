/**
 * Kiểu dữ liệu cho AI import (Gemini Vision, server-only).
 * AI CHỈ tạo dòng NHÁP để Bí thư kiểm tra/sửa tay — KHÔNG phải nguồn sự thật,
 * KHÔNG tự tạo học sinh. Xem docs/gemini-ai-import.md.
 */

/** Đầu vào: ảnh (base64) + mime + tên tệp (nhãn, không nhạy cảm). */
export interface AiImportInput {
  base64: string;
  mimeType: string;
  fileName: string;
}

/** Giới tính chuẩn hóa — KHÔNG suy đoán từ tên; ảnh không ghi ⇒ null. */
export type AiGender = "MALE" | "FEMALE" | "OTHER" | "UNKNOWN" | null;

/** Một dòng học sinh nháp do AI trích xuất (đã chuẩn hóa). */
export interface AiDraftRow {
  full_name: string;
  birth_year: number | null; // 4 chữ số hợp lệ, hoặc null
  birth_date: string | null; // YYYY-MM-DD hoặc null
  gender: AiGender;
  guardian_phone: string; // "" nếu không thấy
  /** Có chữ ký trong giấy tờ hay không (null = chưa rõ). Chỉ metadata, KHÔNG ảnh chữ ký. */
  signature_present: boolean | null;
  signature_note: string; // ghi chú chữ ký (không ảnh/base64)
  confidence: number; // 0..1
  notes: string;
  /** true nếu thiếu field quan trọng / độ tin cậy thấp → bắt buộc kiểm tra tay. */
  needs_review: boolean;
}

/** Kết quả trích xuất: danh sách dòng nháp + cảnh báo chung. */
export interface AiExtractResult {
  rows: AiDraftRow[];
  warnings: string[];
}
