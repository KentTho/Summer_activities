import Link from "next/link";
import { Badge, Card } from "@/components/ui";
import { PageHeader } from "@/components/layout";
import { listMyNotifications } from "@/lib/data/notifications";
import { NOTIFICATION_SCOPE_LABEL } from "@/modules/notifications/domain/scope-type";

export const dynamic = "force-dynamic";

export default async function SecretaryNotificationsPage() {
  const items = await listMyNotifications();

  return (
    <>
      <PageHeader
        title="Thông báo đã gửi"
        description="Thông báo bạn đã gửi cho phụ huynh. Soạn thông báo theo buổi tại trang chi tiết buổi sinh hoạt."
      />

      <Card className="mb-4 border-slate-200 bg-slate-50">
        <p className="text-sm text-slate-600">
          Để gửi thông báo cho phụ huynh của một buổi: vào{" "}
          <Link href="/user/secretary/sessions" className="font-medium text-indigo-600 hover:underline">
            Buổi sinh hoạt
          </Link>{" "}
          → chọn buổi → “Gửi thông báo cho phụ huynh”.
        </p>
      </Card>

      <div className="grid gap-3">
        {items.length === 0 ? (
          <Card>
            <p className="text-sm text-slate-500">Chưa gửi thông báo nào.</p>
          </Card>
        ) : (
          items.map((n) => (
            <Card key={n.id}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-medium text-slate-900">{n.title}</p>
                  {n.body ? <p className="mt-1 text-sm text-slate-600">{n.body}</p> : null}
                  <p className="mt-1 text-xs text-slate-400">
                    {n.sessionTitle ? `${n.sessionTitle} · ` : ""}
                    {n.createdAt.slice(0, 16).replace("T", " ")}
                  </p>
                </div>
                <Badge tone="indigo">
                  {NOTIFICATION_SCOPE_LABEL[n.scope as keyof typeof NOTIFICATION_SCOPE_LABEL] ?? n.scope}
                </Badge>
              </div>
            </Card>
          ))
        )}
      </div>
    </>
  );
}
