/**
 * Logger server nhẹ (MVP) — structured log ra console server, có REDACT PII/secret.
 *
 * Nguyên tắc: KHÔNG log ảnh/base64, số điện thoại, họ tên, API key, dữ liệu nhạy cảm.
 * Chỉ log sự kiện + số liệu + thông điệp lỗi đã làm sạch. Server-only.
 */

const SENSITIVE_KEY_RE = /(key|token|secret|password|base64|image|phone|name|email)/i;

/** Che chuỗi nhạy cảm: base64 dài, dãy số dài (SĐT), để lại dấu vết an toàn. */
export function redactString(value: string): string {
  let out = value;
  // Cắt chuỗi base64/dài bất thường.
  if (out.length > 120) out = out.slice(0, 40) + `…[${out.length} ký tự đã ẩn]`;
  // Che dãy số dài (>=7 chữ số liền) — SĐT/ID.
  out = out.replace(/\d{7,}/g, "[số đã ẩn]");
  return out;
}

/** Làm sạch object meta: bỏ khóa nhạy cảm, redact chuỗi. Không đệ quy sâu (MVP). */
function redactMeta(meta: Record<string, unknown> | undefined): Record<string, unknown> {
  if (!meta) return {};
  const safe: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(meta)) {
    if (SENSITIVE_KEY_RE.test(k)) {
      safe[k] = "[đã ẩn]";
    } else if (typeof v === "string") {
      safe[k] = redactString(v);
    } else if (typeof v === "number" || typeof v === "boolean" || v === null) {
      safe[k] = v;
    } else {
      safe[k] = "[object]";
    }
  }
  return safe;
}

interface LogEntry {
  level: "info" | "warn" | "error";
  event: string;
  ts: string;
  [k: string]: unknown;
}

function emit(entry: LogEntry) {
  const line = JSON.stringify(entry);
  if (entry.level === "error") console.error(line);
  else if (entry.level === "warn") console.warn(line);
  else console.info(line);
}

/** Ghi sự kiện thường (đã redact meta). */
export function logEvent(event: string, meta?: Record<string, unknown>): void {
  emit({ level: "info", event, ts: new Date().toISOString(), ...redactMeta(meta) });
}

/** Ghi lỗi (thông điệp đã redact; KHÔNG log stack có thể chứa dữ liệu). */
export function logError(event: string, err: unknown, meta?: Record<string, unknown>): void {
  const message = err instanceof Error ? redactString(err.message) : "unknown error";
  emit({ level: "error", event, ts: new Date().toISOString(), message, ...redactMeta(meta) });
}
