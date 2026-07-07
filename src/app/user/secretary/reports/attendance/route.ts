/**
 * Xuất DOCX: báo cáo điểm danh theo một buổi sinh hoạt (RLS chặn buổi ngoài phạm vi).
 * Route handler tự xác thực vai trò. Render server-side; ghi audit.
 * Tham số: `?session=<uuid>`.
 */
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth/session";
import { logAudit } from "@/lib/admin/audit";
import { getAttendanceReport } from "@/lib/data/reports";
import { renderDocx } from "@/lib/docx/document";
import { docxResponse } from "@/lib/reports/response";
import { attendanceMergeValues, attendanceReportBlocks, formatGeneratedAt } from "@/lib/reports/blocks";
import { tryTemplateMerge } from "@/lib/reports/template-merge";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const profile = await getCurrentProfile();
  if (!profile || (profile.role !== "SECRETARY" && profile.role !== "ADMIN")) {
    return new Response("Không có quyền truy cập.", { status: 403 });
  }

  const url = new URL(request.url);
  const sessionId = z.string().uuid().safeParse(url.searchParams.get("session"));
  if (!sessionId.success) {
    return new Response("Thiếu hoặc sai mã buổi sinh hoạt.", { status: 400 });
  }

  const report = await getAttendanceReport(sessionId.data);
  if (!report) {
    return new Response("Không tìm thấy buổi (hoặc ngoài phạm vi).", { status: 404 });
  }

  const scopeLabel = profile.role === "ADMIN" ? "Toàn hệ thống" : "Khu phố phụ trách";
  const generatedAt = formatGeneratedAt(new Date());

  const templateId = z.string().uuid().safeParse(url.searchParams.get("template"));
  const merged = templateId.success
    ? await tryTemplateMerge(templateId.data, attendanceMergeValues(report, scopeLabel, generatedAt))
    : null;
  const buffer = merged ?? renderDocx(attendanceReportBlocks(report, scopeLabel, generatedAt));

  const supabase = await createSupabaseServerClient();
  await logAudit(supabase, profile, {
    action: "EXPORT_DOCX",
    entity: "attendance",
    detail: `Điểm danh buổi ${sessionId.data} (${report.summary.total} HS)${merged ? " · theo mẫu" : ""}`,
  });

  return docxResponse(buffer, `diem-danh-${report.sessionDate}`);
}
