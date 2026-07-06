import Link from "next/link";
import { Badge, Card } from "@/components/ui";
import { PageHeader } from "@/components/layout";
import { listSessions } from "@/lib/data/sessions";
import { SESSION_TYPE_LABEL, SESSION_TONE } from "@/modules/sessions/domain/session-type";

export const dynamic = "force-dynamic";

export default async function ParentSchedulePage() {
  const items = await listSessions();

  return (
    <>
      <PageHeader
        title="Lịch sinh hoạt"
        description="Các buổi sinh hoạt liên quan đến con. Xin nghỉ theo từng buổi nếu cần."
      />

      <div className="grid gap-3">
        {items.length === 0 ? (
          <Card>
            <p className="text-sm text-slate-500">Chưa có buổi sinh hoạt nào.</p>
          </Card>
        ) : (
          items.map(({ session, neighborhoods }) => (
            <Card key={session.id}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-medium text-slate-900">{session.title}</p>
                  <p className="mt-1 text-sm text-slate-500">
                    {session.session_date}
                    {session.start_time ? ` · ${session.start_time.slice(0, 5)}` : ""}
                    {session.location ? ` · ${session.location}` : ""}
                  </p>
                  <p className="mt-1 text-xs text-slate-400">
                    Khu phố: {neighborhoods.map((n) => n.name).join(", ") || "—"}
                  </p>
                </div>
                <Badge tone={SESSION_TONE[session.session_type]}>
                  {SESSION_TYPE_LABEL[session.session_type]}
                </Badge>
              </div>
              <Link
                href="/user/parent/leave-requests"
                className="mt-3 inline-block text-sm font-medium text-indigo-600 hover:underline"
              >
                Xin phép nghỉ buổi này →
              </Link>
            </Card>
          ))
        )}
      </div>
    </>
  );
}
