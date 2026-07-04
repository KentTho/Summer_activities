import Link from "next/link";
import { Badge, Button, Card } from "@/components/ui";
import { PageHeader } from "@/components/layout";
import { SESSIONS, neighborhoodName, SESSION_TONE } from "@/lib/mock";
import { SESSION_TYPE_LABEL } from "@/modules/sessions/domain/session-type";

export default function SecretarySessionsPage() {
  return (
    <>
      <PageHeader
        title="Buổi sinh hoạt"
        description="Lập lịch buổi thường và buổi chung nhiều Khu phố. Tạo/sửa bật ở phase sau."
      />

      <div className="mb-4 flex justify-end">
        <Button disabled variant="secondary" className="h-9 px-3 text-xs">
          + Tạo buổi (chưa kết nối)
        </Button>
      </div>

      <div className="grid gap-3">
        {SESSIONS.map((s) => (
          <Card key={s.id}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-medium text-slate-900">{s.title}</p>
                <p className="mt-1 text-sm text-slate-500">
                  {s.date} · {s.time} · {s.location}
                </p>
                <p className="mt-1 text-xs text-slate-400">
                  Khu phố: {s.neighborhoodCodes.map(neighborhoodName).join(", ")} · Dự kiến {s.expectedCount} em
                </p>
              </div>
              <Badge tone={SESSION_TONE[s.type]}>{SESSION_TYPE_LABEL[s.type]}</Badge>
            </div>
            <Link
              href="/user/secretary/attendance"
              className="mt-3 inline-block text-sm font-medium text-indigo-600 hover:underline"
            >
              Điểm danh buổi này →
            </Link>
          </Card>
        ))}
      </div>
    </>
  );
}
