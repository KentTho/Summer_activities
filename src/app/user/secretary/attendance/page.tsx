import { Badge, Button, Card, StatCard } from "@/components/ui";
import { PageHeader } from "@/components/layout";
import { ATTENDANCE_BS001, SESSIONS, ATTENDANCE_TONE } from "@/lib/mock";
import {
  ATTENDANCE_STATUS_LABEL,
  type AttendanceStatus,
} from "@/modules/attendance/domain/attendance-status";

export default function SecretaryAttendancePage() {
  const session = SESSIONS[0];
  const rows = ATTENDANCE_BS001;

  const count = (status: AttendanceStatus) =>
    rows.filter((r) => r.status === status).length;

  return (
    <>
      <PageHeader
        title="Điểm danh"
        description="Chọn buổi và đánh dấu trạng thái từng em. Ghi nhận thật bật ở phase sau."
      />

      <Card className="mb-4">
        <p className="text-xs uppercase tracking-wide text-slate-400">Đang điểm danh</p>
        <p className="mt-1 font-medium text-slate-900">{session.title}</p>
        <p className="text-sm text-slate-500">
          {session.date} · {session.time} · {session.location}
        </p>
      </Card>

      <div className="mb-4 grid gap-4 sm:grid-cols-3">
        <StatCard label="Có mặt" value={count("PRESENT")} />
        <StatCard label="Nghỉ có phép" value={count("EXCUSED")} />
        <StatCard label="Nghỉ không phép" value={count("UNEXCUSED")} />
      </div>

      <Card className="p-0">
        <ul className="divide-y divide-slate-100">
          {rows.map((r) => (
            <li key={r.studentId} className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <span className="font-medium text-slate-900">{r.studentName}</span>
                <Badge tone={ATTENDANCE_TONE[r.status]}>
                  {ATTENDANCE_STATUS_LABEL[r.status]}
                </Badge>
              </div>
              <div className="flex gap-1.5">
                <Button disabled variant="secondary" className="h-8 px-2 text-xs">Có mặt</Button>
                <Button disabled variant="secondary" className="h-8 px-2 text-xs">Có phép</Button>
                <Button disabled variant="secondary" className="h-8 px-2 text-xs">Không phép</Button>
              </div>
            </li>
          ))}
        </ul>
      </Card>

      <div className="mt-4 flex justify-end">
        <Button disabled className="px-4 text-sm">Lưu điểm danh (chưa kết nối)</Button>
      </div>
    </>
  );
}
