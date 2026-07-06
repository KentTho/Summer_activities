import Link from "next/link";
import { Badge, Card } from "@/components/ui";
import { PageHeader } from "@/components/layout";
import { listSessions } from "@/lib/data/sessions";
import { listParentAttendance, listParentChildren } from "@/lib/data/parent";
import { SESSION_TYPE_LABEL, SESSION_TONE } from "@/modules/sessions/domain/session-type";
import { ATTENDANCE_STATUS_LABEL, ATTENDANCE_TONE } from "@/modules/attendance/domain/attendance-status";

export const dynamic = "force-dynamic";

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

export default async function ParentDashboard() {
  const [children, sessionItems, attendance] = await Promise.all([
    listParentChildren(),
    listSessions(),
    listParentAttendance(),
  ]);

  const today = todayISO();
  const upcoming = sessionItems
    .map((i) => i.session)
    .filter((s) => s.session_date >= today)
    .sort((a, b) => a.session_date.localeCompare(b.session_date));
  const nextSession = upcoming[0];
  const recent = attendance.slice(0, 4);

  const greeting =
    children.length === 0
      ? "Xin chào phụ huynh"
      : children.length === 1
        ? `Xin chào, phụ huynh của ${children[0].fullName}`
        : `Xin chào, phụ huynh (${children.length} học sinh)`;

  return (
    <>
      <PageHeader
        title={greeting}
        description="Theo dõi lịch sinh hoạt và trạng thái điểm danh của con."
      />

      {children.length === 0 ? (
        <Card className="mb-4 border-amber-200 bg-amber-50">
          <p className="text-sm text-amber-800">
            Tài khoản của bạn chưa được liên kết với học sinh nào. Vui lòng liên hệ Bí thư
            Khu phố để được liên kết và xem dữ liệu.
          </p>
        </Card>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="Buổi sinh hoạt kế tiếp">
          {nextSession ? (
            <>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium text-slate-900">{nextSession.title}</p>
                  <p className="mt-1 text-sm text-slate-500">
                    {nextSession.session_date}
                    {nextSession.start_time ? ` · ${nextSession.start_time.slice(0, 5)}` : ""}
                    {nextSession.location ? ` · ${nextSession.location}` : ""}
                  </p>
                </div>
                <Badge tone={SESSION_TONE[nextSession.session_type]}>
                  {SESSION_TYPE_LABEL[nextSession.session_type]}
                </Badge>
              </div>
              <div className="mt-4 flex gap-4 text-sm">
                <Link href="/user/parent/schedule" className="font-medium text-indigo-600 hover:underline">
                  Xem lịch →
                </Link>
                <Link href="/user/parent/leave-requests" className="font-medium text-indigo-600 hover:underline">
                  Xin phép nghỉ →
                </Link>
              </div>
            </>
          ) : (
            <p className="text-sm text-slate-500">Chưa có buổi nào sắp tới.</p>
          )}
        </Card>

        <Card title="Điểm danh gần đây">
          {recent.length === 0 ? (
            <p className="text-sm text-slate-500">Chưa có dữ liệu điểm danh.</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {recent.map((h, i) => (
                <li key={i} className="flex items-center justify-between gap-3 py-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-slate-800">{h.sessionTitle}</p>
                    <p className="text-xs text-slate-500">
                      {h.sessionDate}
                      {h.studentName ? ` · ${h.studentName}` : ""}
                    </p>
                  </div>
                  <Badge tone={ATTENDANCE_TONE[h.status]}>{ATTENDANCE_STATUS_LABEL[h.status]}</Badge>
                </li>
              ))}
            </ul>
          )}
          <Link
            href="/user/parent/attendance"
            className="mt-3 inline-block text-sm font-medium text-indigo-600 hover:underline"
          >
            Xem lịch sử →
          </Link>
        </Card>
      </div>
    </>
  );
}
