import { Badge, Button, Card } from "@/components/ui";
import { PageHeader } from "@/components/layout";
import { PARENT_LEAVE_REQUESTS, SESSIONS, LEAVE_TONE } from "@/lib/mock";
import { LEAVE_STATUS_LABEL } from "@/modules/leave-requests/domain/leave-status";

export default function ParentLeaveRequestsPage() {
  return (
    <>
      <PageHeader
        title="Xin phép nghỉ"
        description="Gửi xin phép nghỉ trước buổi để Bí thư ghi nhận là nghỉ có phép."
      />

      <Card className="mb-4">
        <p className="text-sm font-medium text-slate-700">Đơn mới</p>
        <div className="mt-3 space-y-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">Buổi sinh hoạt</label>
            <select
              disabled
              className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-500"
            >
              {SESSIONS.map((s) => (
                <option key={s.id}>{s.title} · {s.date}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">Lý do</label>
            <textarea
              disabled
              rows={3}
              placeholder="Nhập lý do xin nghỉ…"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none disabled:bg-slate-50"
            />
          </div>
          <div className="flex justify-end">
            <Button disabled className="h-9 px-4 text-sm">Gửi đơn (chưa kết nối)</Button>
          </div>
        </div>
      </Card>

      <p className="mb-2 text-sm font-medium text-slate-700">Đơn đã gửi</p>
      <div className="grid gap-3">
        {PARENT_LEAVE_REQUESTS.map((l) => (
          <Card key={l.id}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-medium text-slate-900">{l.sessionTitle}</p>
                <p className="mt-1 text-sm text-slate-500">{l.sessionDate}</p>
                <p className="mt-1 text-sm text-slate-600">Lý do: {l.reason}</p>
                <p className="mt-1 text-xs text-slate-400">Gửi ngày {l.submittedAt}</p>
              </div>
              <Badge tone={LEAVE_TONE[l.status]}>{LEAVE_STATUS_LABEL[l.status]}</Badge>
            </div>
          </Card>
        ))}
      </div>
    </>
  );
}
