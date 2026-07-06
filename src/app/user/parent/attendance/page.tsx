import { Badge, Card, StatCard } from "@/components/ui";
import { PageHeader } from "@/components/layout";
import { listParentAttendance } from "@/lib/data/parent";
import {
  ATTENDANCE_STATUS_LABEL,
  ATTENDANCE_TONE,
  type AttendanceStatus,
} from "@/modules/attendance/domain/attendance-status";

export const dynamic = "force-dynamic";

export default async function ParentAttendanceHistoryPage() {
  const history = await listParentAttendance();
  const count = (status: AttendanceStatus) => history.filter((h) => h.status === status).length;

  return (
    <>
      <PageHeader
        title="Lịch sử điểm danh"
        description="Trạng thái điểm danh các buổi đã qua của con."
      />

      <div className="mb-4 grid gap-4 sm:grid-cols-3">
        <StatCard label="Có mặt" value={count("PRESENT")} />
        <StatCard label="Nghỉ có phép" value={count("EXCUSED")} />
        <StatCard label="Nghỉ không phép" value={count("UNEXCUSED")} />
      </div>

      <Card className="p-0">
        {history.length === 0 ? (
          <p className="px-4 py-6 text-center text-sm text-slate-500">
            Chưa có dữ liệu điểm danh.
          </p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {history.map((h, i) => (
              <li key={i} className="flex items-center justify-between gap-3 px-4 py-3">
                <div className="min-w-0">
                  <p className="truncate font-medium text-slate-900">{h.sessionTitle}</p>
                  <p className="mt-0.5 text-xs text-slate-500">
                    {h.sessionDate}
                    {h.studentName ? ` · ${h.studentName}` : ""}
                  </p>
                </div>
                <Badge tone={ATTENDANCE_TONE[h.status]}>
                  {ATTENDANCE_STATUS_LABEL[h.status]}
                </Badge>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </>
  );
}
