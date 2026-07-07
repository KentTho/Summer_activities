/**
 * Chuyển dữ liệu báo cáo thành mô hình khối `.docx` (DocBlock[]).
 * Hàm thuần (không chạm DB) — tách khỏi tầng dữ liệu để dễ test/tái dùng.
 */
import type { DocBlock } from "@/lib/docx/document";
import type { MergeValues } from "@/lib/docx/merge";
import type { AttendanceReport, StudentReport } from "@/lib/data/reports";
import type { AdminOverview } from "@/lib/data/admin";

const ORG_LINE = "CHƯƠNG TRÌNH SINH HOẠT HÈ";

function metaLine(scopeLabel: string, generatedAt: string): DocBlock {
  return {
    type: "paragraph",
    italic: true,
    text: `Phạm vi: ${scopeLabel} · Xuất lúc: ${generatedAt}`,
  };
}

/** Báo cáo danh sách học sinh. */
export function studentReportBlocks(
  report: StudentReport,
  scopeLabel: string,
  generatedAt: string,
): DocBlock[] {
  const blocks: DocBlock[] = [
    { type: "paragraph", text: ORG_LINE },
    { type: "heading", text: "DANH SÁCH HỌC SINH", level: 1 },
    metaLine(scopeLabel, generatedAt),
    { type: "paragraph", text: `Tổng số học sinh: ${report.rows.length}` },
    { type: "spacer" },
  ];

  if (report.rows.length === 0) {
    blocks.push({ type: "paragraph", text: "Chưa có học sinh trong phạm vi." });
    return blocks;
  }

  blocks.push({
    type: "table",
    header: ["STT", "Họ và tên", "Ngày/năm sinh", "Trường", "Phụ huynh", "SĐT", "Khu phố"],
    rows: report.rows.map((r, i) => [
      String(i + 1),
      r.fullName,
      r.birth,
      r.school,
      r.guardianName,
      r.guardianPhone,
      r.neighborhoodName,
    ]),
  });
  return blocks;
}

/** Báo cáo điểm danh theo buổi sinh hoạt. */
export function attendanceReportBlocks(
  report: AttendanceReport,
  scopeLabel: string,
  generatedAt: string,
): DocBlock[] {
  const s = report.summary;
  const blocks: DocBlock[] = [
    { type: "paragraph", text: ORG_LINE },
    { type: "heading", text: "BÁO CÁO ĐIỂM DANH BUỔI SINH HOẠT", level: 1 },
    metaLine(scopeLabel, generatedAt),
    { type: "paragraph", text: `Buổi: ${report.title}` },
    { type: "paragraph", text: `Ngày: ${report.sessionDate}${report.location ? ` · Địa điểm: ${report.location}` : ""}` },
    {
      type: "paragraph",
      text: `Khu phố: ${report.neighborhoodNames.join(", ") || "—"}`,
    },
    {
      type: "paragraph",
      text: `Tổng: ${s.total} · Có mặt: ${s.present} · Nghỉ có phép: ${s.excused} · Nghỉ không phép: ${s.unexcused} · Chưa điểm danh: ${s.notMarked}`,
    },
    { type: "spacer" },
  ];

  if (report.rows.length === 0) {
    blocks.push({ type: "paragraph", text: "Buổi này chưa có học sinh trong danh sách." });
    return blocks;
  }

  blocks.push({
    type: "table",
    header: ["STT", "Họ và tên", "Khu phố", "SĐT phụ huynh", "Trạng thái", "Ghi chú"],
    rows: report.rows.map((r, i) => [
      String(i + 1),
      r.fullName,
      r.neighborhoodName,
      r.guardianPhone,
      r.statusLabel,
      r.note,
    ]),
  });
  return blocks;
}

/** Báo cáo tổng hợp hệ thống (Admin). */
export function systemReportBlocks(
  overview: AdminOverview,
  neighborhoods: { name: string; studentCount: number; staffCount: number; sessionCount: number; active: boolean }[],
  generatedAt: string,
): DocBlock[] {
  return [
    { type: "paragraph", text: ORG_LINE },
    { type: "heading", text: "BÁO CÁO TỔNG HỢP HỆ THỐNG", level: 1 },
    metaLine("Toàn hệ thống", generatedAt),
    {
      type: "paragraph",
      text: `Khu phố: ${overview.neighborhoods} (đang hoạt động ${overview.activeNeighborhoods}) · Cán bộ phụ trách: ${overview.secretaries} · Phụ huynh: ${overview.parents}`,
    },
    {
      type: "paragraph",
      text: `Học sinh: ${overview.students} · Buổi sinh hoạt: ${overview.sessions} · Đơn nghỉ chờ xử lý: ${overview.pendingLeave}`,
    },
    { type: "spacer" },
    { type: "heading", text: "Thống kê theo Khu phố", level: 2 },
    {
      type: "table",
      header: ["Khu phố", "Học sinh", "Cán bộ", "Buổi", "Trạng thái"],
      rows: neighborhoods.map((n) => [
        n.name,
        String(n.studentCount),
        String(n.staffCount),
        String(n.sessionCount),
        n.active ? "Đang hoạt động" : "Ngừng hoạt động",
      ]),
    },
  ];
}

/** Giá trị merge cho mẫu `.docx` upload — báo cáo danh sách học sinh. */
export function studentMergeValues(
  report: StudentReport,
  scopeLabel: string,
  generatedAt: string,
): MergeValues {
  const studentsText = report.rows
    .map((r, i) => {
      const parts = [r.fullName, r.neighborhoodName, r.school, r.guardianPhone].filter(Boolean);
      return `${i + 1}. ${parts.join(" — ")}`;
    })
    .join("\n");
  return {
    report_title: "DANH SÁCH HỌC SINH",
    generated_at: generatedAt,
    neighborhood_name: report.neighborhoodNames.join(", ") || scopeLabel,
    staff_name: "",
    students_text: studentsText || "(chưa có học sinh)",
    attendance_text: "",
  };
}

/** Giá trị merge cho mẫu `.docx` upload — báo cáo điểm danh theo buổi. */
export function attendanceMergeValues(
  report: AttendanceReport,
  scopeLabel: string,
  generatedAt: string,
): MergeValues {
  const attendanceText = report.rows
    .map((r, i) => {
      const parts = [r.fullName, r.statusLabel, r.note].filter(Boolean);
      return `${i + 1}. ${parts.join(" — ")}`;
    })
    .join("\n");
  return {
    report_title: "BÁO CÁO ĐIỂM DANH BUỔI SINH HOẠT",
    generated_at: generatedAt,
    neighborhood_name: report.neighborhoodNames.join(", ") || scopeLabel,
    session_title: report.title,
    session_date: report.sessionDate,
    attendance_text: attendanceText || "(chưa có học sinh)",
    students_text: "",
  };
}

/** Định dạng thời điểm xuất báo cáo theo giờ Việt Nam (ổn định, không phụ thuộc locale máy). */
export function formatGeneratedAt(date: Date): string {
  const fmt = new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "Asia/Ho_Chi_Minh",
  });
  return fmt.format(date);
}
