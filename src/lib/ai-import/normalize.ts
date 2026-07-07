/**
 * Chuẩn hóa dữ liệu AI trả về (server-only). Best-effort, không tự tin quá:
 * giá trị không hợp lệ → rỗng/null + đánh dấu cần kiểm tra tay.
 */

/** Chuẩn hóa SĐT Việt Nam: +84/84 → 0, bỏ khoảng trắng/dấu; giữ chữ số. */
export function normalizeVnPhone(raw: string | null | undefined): string {
  if (!raw) return "";
  let digits = String(raw).replace(/[^\d+]/g, "");
  digits = digits.replace(/^\+/, "");
  if (digits.startsWith("84")) digits = "0" + digits.slice(2);
  // Giữ đúng chữ số; SĐT VN thường 10 số bắt đầu bằng 0.
  return digits.replace(/[^\d]/g, "");
}

/**
 * Chuẩn hóa ngày sinh về YYYY-MM-DD. Nhận:
 *  - "YYYY-MM-DD" (giữ nếu hợp lệ)
 *  - "d/m/yyyy", "d-m-yyyy", "d.m.yy"…
 * Không hợp lệ → null.
 */
export function normalizeBirthDate(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const s = String(raw).trim();
  if (!s || /^null$/i.test(s)) return null;

  const iso = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (iso) return buildDate(+iso[1], +iso[2], +iso[3]);

  const dmy = s.match(/^(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{2,4})$/);
  if (dmy) {
    let year = +dmy[3];
    if (dmy[3].length === 2) year = year >= 30 ? 1900 + year : 2000 + year;
    return buildDate(year, +dmy[2], +dmy[1]);
  }
  return null;
}

function buildDate(year: number, month: number, day: number): string | null {
  if (year < 1990 || year > 2100) return null;
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${year}-${pad(month)}-${pad(day)}`;
}

/**
 * Dòng cần kiểm tra tay khi: thiếu họ tên, HOẶC thiếu cả ngày sinh và SĐT,
 * HOẶC độ tin cậy thấp (< 0.6).
 */
export function computeNeedsReview(row: {
  full_name: string;
  birth_date: string | null;
  guardian_phone: string;
  confidence: number;
}): boolean {
  if (!row.full_name.trim()) return true;
  if (!row.birth_date && !row.guardian_phone) return true;
  if (row.confidence < 0.6) return true;
  return false;
}
