import { Badge, Button, Card } from "@/components/ui";
import { PageHeader } from "@/components/layout";
import { NOTIFICATIONS } from "@/lib/mock";
import { NOTIFICATION_SCOPE_LABEL } from "@/modules/notifications/domain/scope-type";

export default function SecretaryNotificationsPage() {
  return (
    <>
      <PageHeader
        title="Thông báo"
        description="Soạn thông báo theo Khu phố hoặc theo buổi. Gửi thật bật ở phase notification."
      />

      <Card className="mb-4">
        <p className="text-sm font-medium text-slate-700">Soạn nhanh</p>
        <div className="mt-3 space-y-3">
          <input
            disabled
            placeholder="Tiêu đề thông báo"
            className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none disabled:bg-slate-50"
          />
          <textarea
            disabled
            rows={3}
            placeholder="Nội dung gửi tới phụ huynh/học sinh…"
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none disabled:bg-slate-50"
          />
          <div className="flex justify-end">
            <Button disabled className="h-9 px-4 text-sm">Gửi thông báo (chưa kết nối)</Button>
          </div>
        </div>
      </Card>

      <p className="mb-2 text-sm font-medium text-slate-700">Đã gửi gần đây</p>
      <div className="grid gap-3">
        {NOTIFICATIONS.map((n) => (
          <Card key={n.id}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-medium text-slate-900">{n.title}</p>
                <p className="mt-1 text-sm text-slate-600">{n.body}</p>
                <p className="mt-1 text-xs text-slate-400">{n.createdAt}</p>
              </div>
              <Badge tone="indigo">{NOTIFICATION_SCOPE_LABEL[n.scope]}</Badge>
            </div>
          </Card>
        ))}
      </div>
    </>
  );
}
