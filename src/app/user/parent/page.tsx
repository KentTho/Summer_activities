import Link from "next/link";
import { Badge, Card } from "@/components/ui";
import { PageHeader } from "@/components/layout";
import {
  NOTIFICATIONS,
  PARENT_CHILD_NAME,
  SESSIONS,
  SESSION_TONE,
} from "@/lib/mock";
import { SESSION_TYPE_LABEL } from "@/modules/sessions/domain/session-type";

export default function ParentDashboard() {
  const nextSession = SESSIONS[0];
  const unread = NOTIFICATIONS.filter((n) => !n.read);

  return (
    <>
      <PageHeader
        title={`Xin chào, phụ huynh của ${PARENT_CHILD_NAME}`}
        description="Theo dõi lịch sinh hoạt, thông báo và trạng thái điểm danh của con."
      />

      <div className="grid gap-4 lg:grid-cols-2">
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
          <div className="mt-4 flex gap-4 text-sm">
            <Link href="/user/parent/schedule" className="font-medium text-indigo-600 hover:underline">
              Xem lịch →
            </Link>
            <Link href="/user/parent/leave-requests" className="font-medium text-indigo-600 hover:underline">
              Xin phép nghỉ →
            </Link>
          </div>
        </Card>

        <Card title={`Thông báo mới (${unread.length})`}>
          {unread.length === 0 ? (
            <p className="text-sm text-slate-500">Không có thông báo mới.</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {unread.map((n) => (
                <li key={n.id} className="py-2">
                  <p className="text-sm font-medium text-slate-800">{n.title}</p>
                  <p className="truncate text-xs text-slate-500">{n.body}</p>
                </li>
              ))}
            </ul>
          )}
          <Link
            href="/user/parent/notifications"
            className="mt-3 inline-block text-sm font-medium text-indigo-600 hover:underline"
          >
            Xem tất cả →
          </Link>
        </Card>
      </div>
    </>
  );
}
