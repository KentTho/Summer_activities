/**
 * Kiểu dữ liệu chung cho lớp OCR (server-only).
 * Provider được đặt sau interface để thay thế được (OCR.space → Google Vision…),
 * không khóa nhà cung cấp. Xem docs/ocr-import.md.
 */

/** Đầu vào cho OCR: nội dung nhị phân (base64) + mime + tên tệp (nhãn). */
export interface OcrInput {
  base64: string;
  mimeType: string;
  fileName: string;
}

/** Kết quả OCR thô: text đã nhận dạng + tên provider (để audit/log không nhạy cảm). */
export interface OcrResult {
  text: string;
  provider: string;
}

/** Interface provider OCR — mọi provider đều nhận input và trả text thô. */
export interface OcrProvider {
  readonly name: string;
  recognize(input: OcrInput): Promise<OcrResult>;
}

/** Một dòng học sinh ứng viên do parser suy ra từ text OCR (best-effort). */
export interface ParsedStudentRow {
  full_name: string;
  birth_date: string; // YYYY-MM-DD hoặc ""
  guardian_phone: string; // "" nếu không thấy
}
