import Link from "next/link";
import { Badge, Card } from "@/components/ui";
import { PageHeader } from "@/components/layout";
import { listSessions } from "@/lib/data/sessions";
import { listNeighborhoodsInScope } from "@/lib/data/students";
import { SESSION_TYPE_LABEL, SESSION_TONE } from "@/modules/sessions/domain/session-type";
import { CreateSessionForm } from "./CreateSessionForm";

export const dynamic = "force-dynamic";

export default async function SecretarySessionsPage() {
  const [items, neighborhoods] = await Promise.all([
    listSessions(),
    listNeighborhoodsInScope(),
  ]);
  const todayISO = new Date().toISOString().slice(0, 10);

  return (
    <>
      <PageHeader
        title="Buổi sinh hoạt"
        description="Tạo buổi thường/buổi chung, xem danh sách và vào điểm danh từng buổi."
      />

      {neighborhoods.length === 0 ? (
        <Card className="mb-4 border-amber-200 bg-amber-50">
          <p className="text-sm text-amber-800">
            Bạn chưa được gán Khu phố phụ trách nên chưa thể tạo buổi.
          </p>
        </Card>
      ) : (
        <CreateSessionForm neighborhoods={neighborhoods} />
      )}

      <p className="mb-2 text-sm font-medium text-slate-700">Danh sách buổi</p>
      <div className="grid gap-3">
        {items.length === 0 ? (
          <Card>
            <p className="text-sm text-slate-500">Chưa có buổi nào.</p>
          </Card>
        ) : (
          items.map(({ session, neighborhoods: ns, counts }) => {
            const closed = Boolean(session.closed_at);
            const canceled = Boolean(session.canceled_at);
            const past = session.session_date < todayISO;
            const isJoint = ns.length > 1;
            // Buổi đã chốt/hủy/đã qua → chỉ xem; buổi đang mở & chưa qua → điểm danh.
            const linkLabel = canceled || closed || past ? "Xem →" : "Điểm danh →";
            return (
              <Card key={session.id}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium text-slate-900">{session.title}</p>
                      <Badge tone={SESSION_TONE[session.session_type]}>
                        {SESSION_TYPE_LABEL[session.session_type]}
                      </Badge>
                      {canceled ? (
                        <Badge tone="red">Đã hủy</Badge>
                      ) : (
                        <Badge tone={closed ? "slate" : "green"}>
                          {closed ? "Đã chốt" : "Đang mở"}
                        </Badge>
                      )}
                      {past && !canceled ? <Badge tone="amber">Đã qua</Badge> : null}
                    </div>
                    <p className="mt-1 text-sm text-slate-500">
                      {session.session_date}
                      {session.start_time ? ` · ${session.start_time.slice(0, 5)}` : ""}
                      {session.location ? ` · ${session.location}` : ""}
                    </p>
                    <p className="mt-1 flex flex-wrap items-center gap-1 text-xs text-slate-400">
                      {isJoint ? "Khu phố chung:" : "Khu phố:"}
                      {ns.length === 0 ? " —" : ns.map((n) => (
                        <Badge key={n.id} tone="slate">{n.name}</Badge>
                      ))}
                      <span className="ml-1">
                        · Đã điểm danh {counts.marked} (CM {counts.present} · CP {counts.excused} · KP{" "}
                        {counts.unexcused})
                      </span>
                    </p>
                  </div>
                  <Link
                    href={`/user/secretary/sessions/${session.id}`}
                    className="shrink-0 text-sm font-medium text-indigo-600 hover:underline"
                  >
                    {linkLabel}
                  </Link>
                </div>
              </Card>
            );
          })
        )}
      </div>
    </>
  );
}
