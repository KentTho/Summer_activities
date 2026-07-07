/**
 * Xuất DOCX: báo cáo tổng hợp toàn hệ thống (Admin). Số liệu đọc qua RLS (is_admin()).
 * Route handler tự xác thực ADMIN. Render server-side; ghi audit.
 */
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth/session";
import { logAudit } from "@/lib/admin/audit";
import { getAdminOverview, listNeighborhoodsDetailed } from "@/lib/data/admin";
import { renderDocx } from "@/lib/docx/document";
import { docxResponse } from "@/lib/reports/response";
import { formatGeneratedAt, systemReportBlocks } from "@/lib/reports/blocks";

export const dynamic = "force-dynamic";

export async function GET() {
  const profile = await getCurrentProfile();
  if (!profile || profile.role !== "ADMIN") {
    return new Response("Không có quyền truy cập.", { status: 403 });
  }

  const [overview, neighborhoods] = await Promise.all([
    getAdminOverview(),
    listNeighborhoodsDetailed(),
  ]);
  const blocks = systemReportBlocks(overview, neighborhoods, formatGeneratedAt(new Date()));
  const buffer = renderDocx(blocks);

  const supabase = await createSupabaseServerClient();
  await logAudit(supabase, profile, {
    action: "EXPORT_DOCX",
    entity: "system",
    detail: "Báo cáo tổng hợp hệ thống",
  });

  return docxResponse(buffer, "bao-cao-tong-hop-he-thong");
}
