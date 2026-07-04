import { Badge, Card } from "@/components/ui";
import { PageHeader } from "@/components/layout";
import { NOTIFICATIONS } from "@/lib/mock";
import { NOTIFICATION_SCOPE_LABEL } from "@/modules/notifications/domain/scope-type";

export default function ParentNotificationsPage() {
  return (
    <>
      <PageHeader
        title="Thông báo"
        description="Thông báo từ Bí thư theo Khu phố hoặc theo buổi sinh hoạt của con."
      />

      <div className="grid gap-3">
        {NOTIFICATIONS.map((n) => (
          <Card key={n.id} className={n.read ? undefined : "border-indigo-200"}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  {!n.read ? (
                    <span className="h-2 w-2 shrink-0 rounded-full bg-indigo-500" aria-label="Chưa đọc" />
                  ) : null}
                  <p className="font-medium text-slate-900">{n.title}</p>
                </div>
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
