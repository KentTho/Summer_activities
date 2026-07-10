import { Badge, Button, Card } from "@/components/ui";
import { PageHeader } from "@/components/layout";
import { countMyUnreadNotifications, listMyNotifications } from "@/lib/data/notifications";
import { NOTIFICATION_SCOPE_LABEL } from "@/modules/notifications/domain/scope-type";
import { markAllReadAction, markNotificationReadAction } from "./actions";

export const dynamic = "force-dynamic";

export default async function ParentNotificationsPage() {
  const [items, unread] = await Promise.all([
    listMyNotifications(),
    countMyUnreadNotifications(),
  ]);

  return (
    <>
      <PageHeader
        title="Thông báo"
        description="Thông báo từ Bí thư / Chi Đoàn và Quản trị (hủy/dời buổi, thông báo chung)."
      />

      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="text-sm text-slate-600">
          {unread > 0 ? (
            <>
              Bạn có <span className="font-semibold text-indigo-600">{unread}</span> thông báo chưa đọc.
            </>
          ) : (
            "Bạn đã đọc hết thông báo."
          )}
        </p>
        {unread > 0 ? (
          <form action={markAllReadAction}>
            <Button type="submit" className="h-8 px-3 text-xs">
              Đánh dấu đã đọc tất cả
            </Button>
          </form>
        ) : null}
      </div>

      <div className="grid gap-3">
        {items.length === 0 ? (
          <Card>
            <p className="text-sm text-slate-500">Chưa có thông báo nào.</p>
          </Card>
        ) : (
          items.map((n) => (
            <Card key={n.id} className={n.unread ? "border-indigo-200 bg-indigo-50/40" : undefined}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-medium text-slate-900">
                    {n.unread ? <span className="mr-2 inline-block h-2 w-2 rounded-full bg-indigo-500 align-middle" /> : null}
                    {n.title}
                  </p>
                  {n.body ? <p className="mt-1 text-sm text-slate-600">{n.body}</p> : null}
                  <p className="mt-1 text-xs text-slate-400">
                    {n.sessionTitle
                      ? `${n.sessionTitle}${n.sessionDate ? ` · ${n.sessionDate}` : ""} · `
                      : ""}
                    {n.createdAt.slice(0, 16).replace("T", " ")}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <Badge tone="indigo">
                    {NOTIFICATION_SCOPE_LABEL[n.scope as keyof typeof NOTIFICATION_SCOPE_LABEL] ?? n.scope}
                  </Badge>
                  {n.unread ? (
                    <form action={markNotificationReadAction}>
                      <input type="hidden" name="notification_id" value={n.id} />
                      <button type="submit" className="text-xs text-indigo-600 hover:underline">
                        Đánh dấu đã đọc
                      </button>
                    </form>
                  ) : null}
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </>
  );
}
