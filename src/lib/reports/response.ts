/**
 * Tiện ích trả tệp `.docx` từ route handler (server-side).
 * Đặt Content-Disposition attachment + tên tệp đã chuẩn hóa (chống header injection).
 */
import { DOCX_MIME, safeDocxFilename } from "@/lib/docx/document";

export function docxResponse(buffer: Buffer, baseName: string): Response {
  const filename = safeDocxFilename(baseName);
  const body = new Uint8Array(buffer);
  return new Response(body, {
    status: 200,
    headers: {
      "Content-Type": DOCX_MIME,
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Content-Length": String(body.length),
      "Cache-Control": "no-store",
    },
  });
}
