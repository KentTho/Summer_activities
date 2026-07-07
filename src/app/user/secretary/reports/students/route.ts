/**
 * Xuất DOCX: danh sách học sinh trong phạm vi Bí thư/Chi Đoàn (RLS tự giới hạn).
 * Route handler KHÔNG chạy qua layout ⇒ tự xác thực vai trò tại đây.
 * Render server-side; ghi audit; KHÔNG log dữ liệu học sinh.
 */
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth/session";
import { logAudit } from "@/lib/admin/audit";
import { getStudentReport } from "@/lib/data/reports";
import { renderDocx } from "@/lib/docx/document";
import { docxResponse } from "@/lib/reports/response";
import { formatGeneratedAt, studentReportBlocks } from "@/lib/reports/blocks";

export const dynamic = "force-dynamic";

export async function GET() {
  const profile = await getCurrentProfile();
  if (!profile || (profile.role !== "SECRETARY" && profile.role !== "ADMIN")) {
    return new Response("Không có quyền truy cập.", { status: 403 });
  }

  const report = await getStudentReport();
  const scopeLabel = profile.role === "ADMIN" ? "Toàn hệ thống" : "Khu phố phụ trách";
  const blocks = studentReportBlocks(report, scopeLabel, formatGeneratedAt(new Date()));
  const buffer = renderDocx(blocks);

  const supabase = await createSupabaseServerClient();
  await logAudit(supabase, profile, {
    action: "EXPORT_DOCX",
    entity: "students",
    detail: `Danh sách học sinh (${report.rows.length} HS)`,
  });

  return docxResponse(buffer, "danh-sach-hoc-sinh");
}
