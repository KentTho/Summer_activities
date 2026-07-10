import { Badge, Card } from "@/components/ui";
import { PageHeader } from "@/components/layout";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { listMyNotifications } from "@/lib/data/notifications";
import { NOTIFICATION_SCOPE_LABEL } from "@/modules/notifications/domain/scope-type";
import { SystemNotificationForm } from "./SystemNotificationForm";

export const dynamic = "force-dynamic";

export default async function AdminNotificationsPage() {
  const supabase = await createSupabaseServerClient();
  const [{ data: neighborhoods }, sent] = await Promise.all([
    supabase.from("neighborhoods").select("id, name, code").eq("active", true).order("code"),
    listMyNotifications(30),
  ]);

  return (
    <>
      <PageHeader
        title="Thông báo hệ thống"
        description="Gửi thông báo tới toàn hệ thống hoặc theo Khu phố. Không gửi SMS/email thật."
      />

      <SystemNotificationForm neighborhoods={neighborhoods ?? []} />

      <Card title="Thông báo đã gửi gần đây">
        {sent.length === 0 ? (
          <p className="text-sm text-slate-500">Chưa gửi thông báo nào.</p>
        ) : (
          <div className="grid gap-3">
            {sent.map((n) => (
              <div key={n.id} className="flex items-start justify-between gap-3 border-b border-slate-100 pb-2 last:border-0">
                <div className="min-w-0">
                  <p className="font-medium text-slate-900">{n.title}</p>
                  {n.body ? <p className="mt-1 text-sm text-slate-600">{n.body}</p> : null}
                  <p className="mt-1 text-xs text-slate-400">
                    {n.createdAt.slice(0, 16).replace("T", " ")}
                  </p>
                </div>
                <Badge tone="indigo">
                  {NOTIFICATION_SCOPE_LABEL[n.scope as keyof typeof NOTIFICATION_SCOPE_LABEL] ?? n.scope}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </Card>
    </>
  );
}
