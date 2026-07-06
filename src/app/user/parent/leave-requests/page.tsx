import { Badge, Card } from "@/components/ui";
import { PageHeader } from "@/components/layout";
import { listLeaveRequests } from "@/lib/data/leave";
import { listParentChildren } from "@/lib/data/parent";
import { listSessions } from "@/lib/data/sessions";
import { LEAVE_STATUS_LABEL, LEAVE_TONE } from "@/modules/leave-requests/domain/leave-status";
import { SubmitLeaveForm, type SessionOption } from "./SubmitLeaveForm";

export const dynamic = "force-dynamic";

export default async function ParentLeaveRequestsPage() {
  const [children, sessionItems, requests] = await Promise.all([
    listParentChildren(),
    listSessions(),
    listLeaveRequests(),
  ]);

  const sessions: SessionOption[] = sessionItems.map(({ session }) => ({
    id: session.id,
    label: `${session.title} · ${session.session_date}`,
  }));

  return (
    <>
      <PageHeader
        title="Xin phép nghỉ"
        description="Gửi xin phép nghỉ trước buổi để Bí thư ghi nhận là nghỉ có phép."
      />

      <SubmitLeaveForm kids={children} sessions={sessions} />

      <p className="mb-2 text-sm font-medium text-slate-700">Đơn đã gửi</p>
      <div className="grid gap-3">
        {requests.length === 0 ? (
          <Card>
            <p className="text-sm text-slate-500">Bạn chưa gửi đơn nào.</p>
          </Card>
        ) : (
          requests.map((l) => (
            <Card key={l.id}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-medium text-slate-900">{l.studentName}</p>
                  <p className="mt-1 text-sm text-slate-500">
                    {l.sessionTitle
                      ? `${l.sessionTitle}${l.sessionDate ? ` · ${l.sessionDate}` : ""}`
                      : "Không gắn buổi cụ thể"}
                  </p>
                  <p className="mt-1 text-sm text-slate-600">Lý do: {l.reason || "(không ghi)"}</p>
                  <p className="mt-1 text-xs text-slate-400">Gửi ngày {l.createdAt.slice(0, 10)}</p>
                </div>
                <Badge tone={LEAVE_TONE[l.status]}>{LEAVE_STATUS_LABEL[l.status]}</Badge>
              </div>
            </Card>
          ))
        )}
      </div>
    </>
  );
}
