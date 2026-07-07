/**
 * Placeholder-merge DOCX TỐI GIẢN (server-only) — đổ dữ liệu vào mẫu `.docx` upload.
 *
 * Cách làm: đọc `word/document.xml` của mẫu, thay các placeholder `{{key}}` bằng giá
 * trị đã escape XML, rồi đóng gói lại (giữ nguyên mọi phần khác của gói docx).
 *
 * GIỚI HẠN (ghi rõ — MVP 09A):
 *  - Placeholder phải nằm GỌN trong một run (Word không tách `{{...}}` thành nhiều
 *    run). Nếu bị tách do định dạng giữa chừng thì sẽ không thay được — khi đó
 *    caller fallback sang DOCX tự sinh (`renderDocx`).
 *  - Không hỗ trợ vòng lặp/điều kiện. Văn bản nhiều dòng dùng `<w:br/>` trong cùng run.
 */
import { escapeXmlText } from "./document";
import { unzip } from "./unzip";
import { zipStore } from "./zip";

/** Khóa placeholder được hỗ trợ ở 09A. */
export type MergeKey =
  | "report_title"
  | "generated_at"
  | "neighborhood_name"
  | "staff_name"
  | "session_title"
  | "session_date"
  | "students_text"
  | "attendance_text";

export type MergeValues = Partial<Record<MergeKey, string>>;

/** Escape + chuyển xuống dòng thành ngắt dòng DOCX (trong cùng một run). */
function toDocxValue(raw: string): string {
  const escaped = escapeXmlText(raw ?? "");
  return escaped.replace(/\n/g, '</w:t><w:br/><w:t xml:space="preserve">');
}

/**
 * Trả về Buffer docx đã merge, hoặc `null` nếu mẫu KHÔNG chứa placeholder nào
 * (caller sẽ fallback sang DOCX tự sinh). Ném lỗi nếu mẫu không đọc được.
 */
export function mergeTemplate(templateBuf: Buffer, values: MergeValues): Buffer | null {
  const entries = unzip(templateBuf);
  const docIdx = entries.findIndex((e) => e.name === "word/document.xml");
  if (docIdx < 0) return null;

  let xml = entries[docIdx].data.toString("utf8");

  // Chỉ merge nếu có ít nhất một placeholder được hỗ trợ trong tài liệu.
  const present = (Object.keys(values) as MergeKey[]).filter((k) => xml.includes(`{{${k}}}`));
  if (present.length === 0) return null;

  for (const key of present) {
    xml = xml.split(`{{${key}}}`).join(toDocxValue(values[key] ?? ""));
  }

  entries[docIdx] = { name: "word/document.xml", data: Buffer.from(xml, "utf8") };
  return zipStore(entries.map((e) => ({ name: e.name, data: new Uint8Array(e.data) })));
}
