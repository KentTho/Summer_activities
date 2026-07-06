import { Badge, Card } from "@/components/ui";
import { PageHeader } from "@/components/layout";
import { listLeaveRequests } from "@/lib/data/leave";
import { LEAVE_STATUS, LEAVE_STATUS_LABEL, LEAVE_TONE } from "@/modules/leave-requests/domain/leave-status";
import { acknowledgeLeave, rejectLeave } from "./actions";

export const dynamic = "force-dynamic";

export default async function SecretaryLeaveRequestsPage() {
  const requests = await listLeaveRequests();

  return (
    <>
      <PageHeader
        title="Đơn xin nghỉ"
        description="Phụ huynh gửi trước buổi. Ghi nhận có phép sẽ tự gợi ý điểm danh 'Nghỉ có phép' cho buổi tương ứng."
      />

      <div className="grid gap-3">
        {requests.length === 0 ? (
          <Card>
            <p className="text-sm text-slate-500">Chưa có đơn xin nghỉ nào.</p>
          </Card>
        ) : (
          requests.map((l) => {
            const pending = l.status === LEAVE_STATUS.SUBMITTED;
            return (
              <Card key={l.id}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-medium text-slate-900">{l.studentName}</p>
                    <p className="mt-1 text-sm text-slate-500">
                      {l.sessionTitle
                        ? `${l.sessionTitle}${l.sessionDate ? ` · ${l.sessionDate}` : ""}`
                        : "Không gắn buổi cụ thể"}
                    </p>
                    <p className="mt-1 text-sm text-slate-600">
                      Lý do: {l.reason || "(không ghi)"}
                    </p>
                    <p className="mt-1 text-xs text-slate-400">
                      Gửi ngày {l.createdAt.slice(0, 10)}
                    </p>
                  </div>
                  <Badge tone={LEAVE_TONE[l.status]}>{LEAVE_STATUS_LABEL[l.status]}</Badge>
                </div>
                {pending ? (
                  <div className="mt-3 flex gap-1.5">
                    <form action={acknowledgeLeave}>
                      <input type="hidden" name="leave_id" value={l.id} />
                      <button
                        type="submit"
                        className="inline-flex h-8 items-center rounded-lg bg-green-600 px-3 text-xs font-semibold text-white hover:bg-green-700"
                      >
                        Ghi nhận có phép
                      </button>
                    </form>
                    <form action={rejectLeave}>
                      <input type="hidden" name="leave_id" value={l.id} />
                      <button
                        type="submit"
                        className="inline-flex h-8 items-center rounded-lg bg-slate-100 px-3 text-xs font-medium text-slate-700 hover:bg-slate-200"
                      >
                        Từ chối
                      </button>
                    </form>
                  </div>
                ) : null}
              </Card>
            );
          })
        )}
      </div>
    </>
  );
}
