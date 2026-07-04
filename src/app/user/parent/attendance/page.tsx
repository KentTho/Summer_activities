import { Badge, Card, StatCard } from "@/components/ui";
import { PageHeader } from "@/components/layout";
import {
  PARENT_ATTENDANCE_HISTORY,
  PARENT_CHILD_NAME,
  ATTENDANCE_TONE,
} from "@/lib/mock";
import {
  ATTENDANCE_STATUS_LABEL,
  type AttendanceStatus,
} from "@/modules/attendance/domain/attendance-status";

export default function ParentAttendanceHistoryPage() {
  const history = PARENT_ATTENDANCE_HISTORY;
  const count = (status: AttendanceStatus) =>
    history.filter((h) => h.status === status).length;

  return (
    <>
      <PageHeader
        title="Lịch sử điểm danh"
        description={`Trạng thái điểm danh các buổi đã qua của ${PARENT_CHILD_NAME}.`}
      />

      <div className="mb-4 grid gap-4 sm:grid-cols-3">
        <StatCard label="Có mặt" value={count("PRESENT")} />
        <StatCard label="Nghỉ có phép" value={count("EXCUSED")} />
        <StatCard label="Nghỉ không phép" value={count("UNEXCUSED")} />
      </div>

      <Card className="p-0">
        <ul className="divide-y divide-slate-100">
          {history.map((h) => (
            <li key={h.date} className="flex items-center justify-between gap-3 px-4 py-3">
              <div>
                <p className="font-medium text-slate-900">{h.sessionTitle}</p>
                <p className="mt-0.5 text-xs text-slate-500">{h.date}</p>
              </div>
              <Badge tone={ATTENDANCE_TONE[h.status]}>
                {ATTENDANCE_STATUS_LABEL[h.status]}
              </Badge>
            </li>
          ))}
        </ul>
      </Card>
    </>
  );
}
