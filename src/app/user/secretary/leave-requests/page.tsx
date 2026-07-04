import { Badge, Button, Card } from "@/components/ui";
import { PageHeader } from "@/components/layout";
import { LEAVE_REQUESTS, neighborhoodName, LEAVE_TONE } from "@/lib/mock";
import {
  LEAVE_STATUS,
  LEAVE_STATUS_LABEL,
} from "@/modules/leave-requests/domain/leave-status";

export default function SecretaryLeaveRequestsPage() {
  return (
    <>
      <PageHeader
        title="Đơn xin nghỉ"
        description="Phụ huynh gửi trước buổi; Bí thư ghi nhận là nghỉ có phép hoặc từ chối."
      />

      <div className="grid gap-3">
        {LEAVE_REQUESTS.map((l) => {
          const pending = l.status === LEAVE_STATUS.SUBMITTED;
          return (
            <Card key={l.id}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium text-slate-900">{l.studentName}</p>
                  <p className="mt-1 text-sm text-slate-500">
                    {l.sessionTitle} · {l.sessionDate} · {neighborhoodName(l.neighborhoodCode)}
                  </p>
                  <p className="mt-1 text-sm text-slate-600">Lý do: {l.reason}</p>
                  <p className="mt-1 text-xs text-slate-400">Gửi ngày {l.submittedAt}</p>
                </div>
                <Badge tone={LEAVE_TONE[l.status]}>{LEAVE_STATUS_LABEL[l.status]}</Badge>
              </div>
              {pending ? (
                <div className="mt-3 flex gap-1.5">
                  <Button disabled className="h-8 px-3 text-xs">Ghi nhận có phép</Button>
                  <Button disabled variant="secondary" className="h-8 px-3 text-xs">Từ chối</Button>
                </div>
              ) : null}
            </Card>
          );
        })}
      </div>
    </>
  );
}
