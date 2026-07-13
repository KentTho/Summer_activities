import { PageHeader } from "@/components/layout";
import { listLeaveRequests } from "@/lib/data/leave";
import { listSessions } from "@/lib/data/sessions";
import { listMyNotifications } from "@/lib/data/notifications";
import { LEAVE_STATUS } from "@/modules/leave-requests/domain/leave-status";
import { OperationsTabs } from "./OperationsTabs";
import { LeaveRequestsPanel } from "./LeaveRequestsPanel";
import { NotificationsPanel } from "./NotificationsPanel";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{ tab?: string }>;
}

/**
 * Trang Vận hành buổi sinh hoạt (10F) — gộp "Đơn xin nghỉ" + "Thông báo phụ huynh"
 * thành một mục điều hướng, chia 2 tab. Dữ liệu/logic/RLS giữ nguyên.
 */
export default async function SecretaryOperationsPage({ searchParams }: PageProps) {
  const { tab } = await searchParams;
  const initialTab = tab === "notifications" ? "notifications" : "leave";

  const [leaveRequests, sessions, sent] = await Promise.all([
    listLeaveRequests(),
    listSessions(),
    listMyNotifications(),
  ]);

  const pendingLeaveCount = leaveRequests.filter(
    (l) => l.status === LEAVE_STATUS.SUBMITTED,
  ).length;

  return (
    <>
      <PageHeader
        title="Vận hành buổi sinh hoạt"
        description="Xử lý đơn xin nghỉ của phụ huynh và gửi thông báo cho phụ huynh theo buổi."
      />

      <OperationsTabs
        initialTab={initialTab}
        pendingLeaveCount={pendingLeaveCount}
        leavePanel={
          <LeaveRequestsPanel
            requests={leaveRequests.map((l) => ({
              id: l.id,
              studentName: l.studentName,
              sessionTitle: l.sessionTitle,
              sessionDate: l.sessionDate,
              reason: l.reason,
              createdAt: l.createdAt,
              status: l.status,
            }))}
          />
        }
        notificationsPanel={
          <NotificationsPanel
            sessions={sessions.map((s) => ({
              id: s.session.id,
              title: s.session.title,
              sessionDate: s.session.session_date,
              neighborhoods: s.neighborhoods.map((n) => n.name),
              canceled: Boolean(s.session.canceled_at),
            }))}
            sent={sent.map((n) => ({
              id: n.id,
              title: n.title,
              body: n.body,
              scope: n.scope,
              sessionTitle: n.sessionTitle,
              createdAt: n.createdAt,
            }))}
          />
        }
      />
    </>
  );
}
