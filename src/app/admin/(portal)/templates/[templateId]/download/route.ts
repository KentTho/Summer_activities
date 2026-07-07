/**
 * Tải lại tệp mẫu DOCX đã upload (Admin). Bucket PRIVATE — không public URL.
 * Route handler tự xác thực ADMIN (không qua layout). Đọc binary bằng service role
 * (sau khi đã xác thực vai trò); metadata tra qua RLS. Ghi audit.
 */
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth/session";
import { logAudit } from "@/lib/admin/audit";
import { downloadTemplateBinary } from "@/lib/storage/templates";
import { DOCX_MIME, safeDocxFilename } from "@/lib/docx/document";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ templateId: string }> },
) {
  const profile = await getCurrentProfile();
  if (!profile || profile.role !== "ADMIN") {
    return new Response("Không có quyền truy cập.", { status: 403 });
  }

  const { templateId } = await params;
  const supabase = await createSupabaseServerClient();
  const { data: tpl } = await supabase
    .from("export_templates")
    .select("name, document_id")
    .eq("id", templateId)
    .maybeSingle();
  if (!tpl?.document_id) {
    return new Response("Mẫu chưa có tệp đính kèm.", { status: 404 });
  }

  const { data: doc } = await supabase
    .from("uploaded_documents")
    .select("path")
    .eq("id", tpl.document_id)
    .maybeSingle();
  if (!doc?.path) return new Response("Không tìm thấy tệp.", { status: 404 });

  const buffer = await downloadTemplateBinary(doc.path);
  if (!buffer) return new Response("Không đọc được tệp từ kho lưu trữ.", { status: 404 });

  await logAudit(supabase, profile, {
    action: "DOWNLOAD_TEMPLATE",
    entity: "export_templates",
    detail: tpl.name,
  });

  const body = new Uint8Array(buffer);
  return new Response(body, {
    status: 200,
    headers: {
      "Content-Type": DOCX_MIME,
      "Content-Disposition": `attachment; filename="${safeDocxFilename(tpl.name)}"`,
      "Content-Length": String(body.length),
      "Cache-Control": "no-store",
    },
  });
}
