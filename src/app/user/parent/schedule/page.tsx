import Link from "next/link";
import { Badge, Card } from "@/components/ui";
import { PageHeader } from "@/components/layout";
import { SESSIONS, neighborhoodName, SESSION_TONE } from "@/lib/mock";
import { SESSION_TYPE_LABEL } from "@/modules/sessions/domain/session-type";

export default function ParentSchedulePage() {
  return (
    <>
      <PageHeader
        title="Lịch sinh hoạt"
        description="Các buổi sinh hoạt sắp tới của con. Đăng ký/xin nghỉ theo từng buổi."
      />

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
                  Khu phố: {s.neighborhoodCodes.map(neighborhoodName).join(", ")}
                </p>
              </div>
              <Badge tone={SESSION_TONE[s.type]}>{SESSION_TYPE_LABEL[s.type]}</Badge>
            </div>
            <Link
              href="/user/parent/leave-requests"
              className="mt-3 inline-block text-sm font-medium text-indigo-600 hover:underline"
            >
              Xin phép nghỉ buổi này →
            </Link>
          </Card>
        ))}
      </div>
    </>
  );
}
