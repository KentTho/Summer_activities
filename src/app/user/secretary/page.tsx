import Link from "next/link";
import { Badge, Card, StatCard } from "@/components/ui";
import { PageHeader } from "@/components/layout";
import {
  LEAVE_REQUESTS,
  SESSIONS,
  STUDENTS,
  SESSION_TONE,
} from "@/lib/mock";
import { SESSION_TYPE_LABEL } from "@/modules/sessions/domain/session-type";
import { LEAVE_STATUS } from "@/modules/leave-requests/domain/leave-status";

export default function SecretaryDashboard() {
  const activeStudents = STUDENTS.filter((s) => s.active).length;
  const pendingLeaves = LEAVE_REQUESTS.filter(
    (l) => l.status === LEAVE_STATUS.SUBMITTED,
  );
  const nextSession = SESSIONS[0];

  return (
    <>
      <PageHeader
        title="Bảng điều khiển Bí thư"
        description="Tổng quan nhanh trong phạm vi Khu phố phụ trách (KP01, KP02)."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Học sinh đang học" value={activeStudents} hint="Trong Khu phố phụ trách" />
        <StatCard label="Buổi sắp tới" value={SESSIONS.length} hint="7 ngày tới" />
        <StatCard label="Cần điểm danh" value={nextSession.expectedCount} hint={nextSession.title} />
        <StatCard label="Đơn chờ xử lý" value={pendingLeaves.length} hint="Xin phép nghỉ" />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Card title="Buổi sinh hoạt kế tiếp">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-medium text-slate-900">{nextSession.title}</p>
              <p className="mt-1 text-sm text-slate-500">
                {nextSession.date} · {nextSession.time} · {nextSession.location}
              </p>
            </div>
            <Badge tone={SESSION_TONE[nextSession.type]}>
              {SESSION_TYPE_LABEL[nextSession.type]}
            </Badge>
          </div>
          <Link
            href="/user/secretary/attendance"
            className="mt-4 inline-block text-sm font-medium text-indigo-600 hover:underline"
          >
            Vào điểm danh →
          </Link>
        </Card>

        <Card title="Đơn xin nghỉ chờ xử lý">
          {pendingLeaves.length === 0 ? (
            <p className="text-sm text-slate-500">Không có đơn nào.</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {pendingLeaves.map((l) => (
                <li key={l.id} className="flex items-center justify-between py-2 text-sm">
                  <span className="text-slate-700">
                    {l.studentName}
                    <span className="text-slate-400"> · {l.sessionTitle}</span>
                  </span>
                  <Badge tone="blue">Chờ xử lý</Badge>
                </li>
              ))}
            </ul>
          )}
          <Link
            href="/user/secretary/leave-requests"
            className="mt-4 inline-block text-sm font-medium text-indigo-600 hover:underline"
          >
            Xem tất cả đơn →
          </Link>
        </Card>
      </div>
    </>
  );
}
