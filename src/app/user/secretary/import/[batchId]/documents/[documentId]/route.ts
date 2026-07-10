/**
 * Xem/tải ẢNH GỐC AI import (đối chiếu khi AI đọc sai). Bucket PRIVATE — không public URL.
 *
 * Xác thực NGAY trong route handler (KHÔNG dựa vào layout):
 *   - ADMIN: xem mọi ảnh.
 *   - SECRETARY: chỉ ảnh thuộc lô mình có quyền (chủ lô hoặc Khu phố phụ trách) —
 *     quyền này do RLS `import_batches` (ib_select) quyết định khi đọc lô bằng server client.
 *   - PARENT / chưa đăng nhập: chặn.
 * Ảnh được ràng buộc vào đúng `import_batch_id` + bucket `ai-import-uploads`.
 * Đọc nhị phân bằng service role CHỈ SAU khi đã chứng minh quyền với lô. Ghi audit,
 * KHÔNG log PII/path/nội dung. KHÔNG trả bucket/path ra client.
 */
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth/session";
import { logAudit } from "@/lib/admin/audit";
import { hasServiceRoleKey } from "@/lib/env";
import { logError, logEvent } from "@/lib/monitoring/server-log";
import { ROLES } from "@/modules/auth/domain/roles";
import {
  downloadAiImportImage,
  extForMime,
  getAiImportDocForBatch,
} from "@/lib/storage/ai-import";

const STORAGE_NOT_CONFIGURED =
  "Dịch vụ lưu trữ chưa được cấu hình, vui lòng liên hệ Admin hệ thống.";

export const dynamic = "force-dynamic";

const IMAGE_MIME = new Set(["image/jpeg", "image/png", "image/webp"]);
const uuid = z.string().uuid();

function textResponse(message: string, status: number): Response {
  return new Response(message, {
    status,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ batchId: string; documentId: string }> },
) {
  const profile = await getCurrentProfile();
  if (!profile) return textResponse("Chưa đăng nhập.", 403);
  if (profile.role !== ROLES.ADMIN && profile.role !== ROLES.SECRETARY) {
    return textResponse("Không có quyền truy cập.", 403);
  }

  const { batchId, documentId } = await params;

  // (0) Validate UUID SỚM trước khi chạm DB — id sai định dạng ⇒ 404 nhanh, không lộ path/bucket.
  if (!uuid.safeParse(batchId).success || !uuid.safeParse(documentId).success) {
    return textResponse("Không tìm thấy.", 404);
  }

  // (1) Chứng minh quyền với LÔ qua RLS (ib_select: admin / chủ lô / Khu phố phụ trách).
  //     Không thấy lô ⇒ 404 (không tiết lộ tồn tại).
  const supabase = await createSupabaseServerClient();
  const { data: batch } = await supabase
    .from("import_batches")
    .select("id")
    .eq("id", batchId)
    .maybeSingle();
  if (!batch) return textResponse("Không tìm thấy.", 404);

  // (2a) Phần đọc nhị phân cần SERVICE ROLE. Thiếu key (vd chưa cấu hình env production)
  //      ⇒ trả 503 THÂN THIỆN thay vì 500 trần. KHÔNG log key/path/PII.
  if (!hasServiceRoleKey()) {
    logEvent("ai_image_storage_not_configured", { role: profile.role });
    return textResponse(STORAGE_NOT_CONFIGURED, 503);
  }

  // (2b) Ảnh phải thuộc ĐÚNG lô này + bucket ai-import-uploads (service role, đã có quyền lô).
  //      Bọc try/catch: admin client/Storage lỗi bất ngờ ⇒ 503, KHÔNG để 500 trần lộ stack.
  let doc: Awaited<ReturnType<typeof getAiImportDocForBatch>>;
  let buffer: Awaited<ReturnType<typeof downloadAiImportImage>>;
  try {
    doc = await getAiImportDocForBatch(documentId, batchId);
    if (!doc) return textResponse("Không tìm thấy ảnh.", 404);
    buffer = await downloadAiImportImage(doc.path);
  } catch (err) {
    logError("ai_image_storage_error", err, { role: profile.role });
    return textResponse(STORAGE_NOT_CONFIGURED, 503);
  }
  if (!buffer) return textResponse("Không đọc được ảnh từ kho lưu trữ.", 404);

  const download = new URL(request.url).searchParams.get("download") === "1";
  const mime = doc.mimeType && IMAGE_MIME.has(doc.mimeType) ? doc.mimeType : "application/octet-stream";
  const ext = extForMime(doc.mimeType ?? "");
  // Tên tệp KHÔNG chứa path/PII — chỉ id tài liệu.
  const filename = `ai-import-${documentId}.${ext}`;

  // (3) Audit — chỉ id lô/tài liệu, KHÔNG PII/path/nội dung.
  await logAudit(supabase, profile, {
    action: download ? "DOWNLOAD_AI_IMPORT_IMAGE" : "VIEW_AI_IMPORT_IMAGE",
    entity: "uploaded_documents",
    detail: `lô ${batchId}, ảnh ${documentId}`,
  });

  const body = new Uint8Array(buffer);
  return new Response(body, {
    status: 200,
    headers: {
      "Content-Type": mime,
      "Content-Disposition": `${download ? "attachment" : "inline"}; filename="${filename}"`,
      "Content-Length": String(body.length),
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
