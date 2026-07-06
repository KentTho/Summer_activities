import { Badge, Card, StatCard } from "@/components/ui";
import { PageHeader } from "@/components/layout";
import { listSessions } from "@/lib/data/sessions";
import {
  SESSION_TYPE,
  SESSION_TYPE_LABEL,
  SESSION_TONE,
} from "@/modules/sessions/domain/session-type";

export const dynamic = "force-dynamic";

export default async function AdminSessionsOverviewPage() {
  const items = await listSessions();
  const joint = items.filter((i) => i.session.session_type === SESSION_TYPE.JOINT).length;
  const closed = items.filter((i) => i.session.closed_at).length;

  return (
    <>
      <PageHeader
        title="Buổi sinh hoạt — tổng quan hệ thống"
        description="Toàn bộ buổi thường và buổi chung (chỉ xem). Tạo/điểm danh ở cổng Bí thư."
      />

      <div className="mb-4 grid gap-4 sm:grid-cols-3">
        <StatCard label="Tổng số buổi" value={items.length} />
        <StatCard label="Buổi chung" value={joint} hint="Nhiều Khu phố" />
        <StatCard label="Đã chốt" value={closed} hint={`${items.length - closed} đang mở`} />
      </div>

      <div className="grid gap-3">
        {items.length === 0 ? (
          <Card>
            <p className="text-sm text-slate-500">Chưa có buổi nào trong hệ thống.</p>
          </Card>
        ) : (
          items.map(({ session, neighborhoods, counts }) => (
            <Card key={session.id}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium text-slate-900">{session.title}</p>
                    <Badge tone={session.closed_at ? "slate" : "green"}>
                      {session.closed_at ? "Đã chốt" : "Đang mở"}
                    </Badge>
                  </div>
                  <p className="mt-1 text-sm text-slate-500">
                    {session.session_date}
                    {session.start_time ? ` · ${session.start_time.slice(0, 5)}` : ""}
                    {session.location ? ` · ${session.location}` : ""}
                  </p>
                  <p className="mt-1 text-xs text-slate-400">
                    Khu phố: {neighborhoods.map((n) => n.name).join(", ") || "—"} · Đã điểm danh{" "}
                    {counts.marked} (CM {counts.present} · CP {counts.excused} · KP{" "}
                    {counts.unexcused})
                  </p>
                </div>
                <Badge tone={SESSION_TONE[session.session_type]}>
                  {SESSION_TYPE_LABEL[session.session_type]}
                </Badge>
              </div>
            </Card>
          ))
        )}
      </div>
    </>
  );
}
