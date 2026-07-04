import { Badge, Card, StatCard } from "@/components/ui";
import { PageHeader } from "@/components/layout";
import { SESSIONS, neighborhoodName, SESSION_TONE } from "@/lib/mock";
import {
  SESSION_TYPE,
  SESSION_TYPE_LABEL,
} from "@/modules/sessions/domain/session-type";

export default function AdminSessionsOverviewPage() {
  const joint = SESSIONS.filter((s) => s.type === SESSION_TYPE.JOINT).length;

  return (
    <>
      <PageHeader
        title="Buổi sinh hoạt — tổng quan hệ thống"
        description="Toàn bộ buổi thường và buổi chung nhiều Khu phố (chỉ xem). Tạo/sửa ở cổng Bí thư."
      />

      <div className="mb-4 grid gap-4 sm:grid-cols-3">
        <StatCard label="Tổng số buổi" value={SESSIONS.length} />
        <StatCard label="Buổi chung" value={joint} hint="Nhiều Khu phố" />
        <StatCard label="Buổi thường" value={SESSIONS.length - joint} />
      </div>

      <div className="grid gap-3">
        {SESSIONS.map((s) => (
          <Card key={s.id}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-medium text-slate-900">{s.title}</p>
                <p className="mt-1 text-sm text-slate-500">{s.date} · {s.time} · {s.location}</p>
                <p className="mt-1 text-xs text-slate-400">
                  Khu phố: {s.neighborhoodCodes.map(neighborhoodName).join(", ")} · Dự kiến {s.expectedCount} em
                </p>
              </div>
              <Badge tone={SESSION_TONE[s.type]}>{SESSION_TYPE_LABEL[s.type]}</Badge>
            </div>
          </Card>
        ))}
      </div>
    </>
  );
}
