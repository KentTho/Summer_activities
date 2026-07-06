/**
 * Chuẩn hóa text OCR thô thành các dòng học sinh ứng viên (best-effort).
 *
 * QUAN TRỌNG: đây CHỈ là gợi ý để Bí thư kiểm tra/sửa tay — KHÔNG phải nguồn sự thật.
 * Không tự tin quá: chỉ tách những gì chắc chắn (SĐT, ngày sinh) và coi phần còn lại là tên.
 * Mọi dòng do parser tạo sẽ được đánh dấu chưa-duyệt (reviewed=false).
 */
import type { ParsedStudentRow } from "./types";

/** SĐT VN: 0xxxxxxxxx (10 số) / 0xxxxxxxxxx (11) / +84xxxxxxxxx. */
const PHONE_RE = /(?:\+?84|0)(?:\d[\s.\-]?){8,10}\d/;
/** Ngày: d/m/yyyy, d-m-yyyy, d.m.yy… */
const DATE_RE = /\b(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})\b/;
/** Đầu dòng đánh số STT: "1.", "12)", "3 -". */
const LEADING_INDEX_RE = /^\s*\d{1,3}\s*[.)\-]\s*/;
/** Dòng tiêu đề cần bỏ qua. */
const HEADER_RE = /^(stt|họ\s*(và\s*)?tên|ngày\s*sinh|số\s*đt|sđt|điện\s*thoại|phụ\s*huynh|danh\s*sách)\b/iu;

function normalizePhone(raw: string): string {
  const digits = raw.replace(/[^\d]/g, "");
  if (digits.startsWith("84")) return "0" + digits.slice(2);
  return digits;
}

function normalizeDate(m: RegExpMatchArray): string {
  const [, d, mo, y] = m;
  let year = parseInt(y, 10);
  if (y.length === 2) year = year >= 30 ? 1900 + year : 2000 + year;
  const day = parseInt(d, 10);
  const month = parseInt(mo, 10);
  if (month < 1 || month > 12 || day < 1 || day > 31) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${year}-${pad(month)}-${pad(day)}`;
}

function cleanName(raw: string): string {
  return raw
    .replace(/[|;•·]+/g, " ")
    .replace(/[\s,.-]+$/u, "")
    .replace(/^[\s,.-]+/u, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

/**
 * Tách một dòng text thành ứng viên học sinh. Trả null nếu không đủ tin cậy
 * (không có tên hợp lệ và cũng không có SĐT).
 */
export function parseLine(line: string): ParsedStudentRow | null {
  let rest = line.replace(LEADING_INDEX_RE, "").trim();
  if (rest.length < 2 || HEADER_RE.test(rest)) return null;

  let guardian_phone = "";
  const phoneMatch = rest.match(PHONE_RE);
  if (phoneMatch) {
    guardian_phone = normalizePhone(phoneMatch[0]);
    rest = rest.replace(phoneMatch[0], " ");
  }

  let birth_date = "";
  const dateMatch = rest.match(DATE_RE);
  if (dateMatch) {
    birth_date = normalizeDate(dateMatch);
    rest = rest.replace(dateMatch[0], " ");
  }

  const full_name = cleanName(rest);
  const hasLetter = /\p{L}/u.test(full_name);

  if ((!full_name || !hasLetter) && !guardian_phone) return null;
  return { full_name: hasLetter ? full_name : "", birth_date, guardian_phone };
}

/** Chuyển toàn bộ text OCR thành danh sách dòng ứng viên (đã lọc rác). */
export function parseOcrText(text: string): ParsedStudentRow[] {
  return text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)
    .map(parseLine)
    .filter((r): r is ParsedStudentRow => r !== null);
}
