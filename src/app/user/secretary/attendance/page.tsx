import Link from "next/link";
import { Badge, Card } from "@/components/ui";
import { PageHeader } from "@/components/layout";
import { listSessions } from "@/lib/data/sessions";
import { SESSION_TYPE_LABEL, SESSION_TONE } from "@/modules/sessions/domain/session-type";

export const dynamic = "force-dynamic";

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

export default async function SecretaryAttendancePage() {
  const items = await listSessions();
  const today = todayISO();

  const todaySessions = items.filter((i) => i.session.session_date === today);
  const others = items.filter((i) => i.session.session_date !== today);

  const renderItem = ({
    session,
    neighborhoods,
    counts,
  }: (typeof items)[number]) => {
    const closed = Boolean(session.closed_at);
    return (
      <Card key={session.id}>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-medium text-slate-900">{session.title}</p>
              <Badge tone={SESSION_TONE[session.session_type]}>
                {SESSION_TYPE_LABEL[session.session_type]}
              </Badge>
              <Badge tone={closed ? "slate" : "green"}>
                {closed ? "Đã chốt" : "Đang mở"}
              </Badge>
            </div>
            <p className="mt-1 text-sm text-slate-500">
              {session.session_date}
              {session.start_time ? ` · ${session.start_time.slice(0, 5)}` : ""}
              {session.location ? ` · ${session.location}` : ""}
            </p>
            <p className="mt-1 text-xs text-slate-400">
              Khu phố: {neighborhoods.map((n) => n.name).join(", ") || "—"} · Đã điểm danh{" "}
              {counts.marked}
            </p>
          </div>
          <Link
            href={`/user/secretary/sessions/${session.id}`}
            className="shrink-0 text-sm font-medium text-indigo-600 hover:underline"
          >
            {closed ? "Xem →" : "Điểm danh →"}
          </Link>
        </div>
      </Card>
    );
  };

  return (
    <>
      <PageHeader
        title="Điểm danh"
        description="Chọn buổi để điểm danh. Buổi hôm nay được ưu tiên phía trên."
      />

      <p className="mb-2 text-sm font-medium text-slate-700">Buổi hôm nay</p>
      <div className="mb-6 grid gap-3">
        {todaySessions.length === 0 ? (
          <Card>
            <p className="text-sm text-slate-500">Hôm nay không có buổi nào.</p>
          </Card>
        ) : (
          todaySessions.map(renderItem)
        )}
      </div>

      <p className="mb-2 text-sm font-medium text-slate-700">Các buổi khác</p>
      <div className="grid gap-3">
        {others.length === 0 ? (
          <Card>
            <p className="text-sm text-slate-500">Chưa có buổi nào khác.</p>
          </Card>
        ) : (
          others.map(renderItem)
        )}
      </div>
    </>
  );
}
