import { Badge, Card } from "@/components/ui";
import { PageHeader, ROLE_LABEL } from "@/components/layout";
import { AUDIT_LOGS } from "@/lib/mock";

export default function AdminAuditPage() {
  return (
    <>
      <PageHeader
        title="Audit log"
        description="Nhật ký thao tác nhạy cảm (chỉ xem). Không cho sửa/xóa từ UI. Ghi thật ở phase DB."
      />

      <Card className="p-0">
        <ul className="divide-y divide-slate-100">
          {AUDIT_LOGS.map((a) => (
            <li key={a.id} className="px-4 py-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-medium text-slate-900">{a.action}</p>
                  <p className="mt-0.5 text-sm text-slate-600">{a.detail}</p>
                  <p className="mt-1 text-xs text-slate-400">
                    {a.actorName} · {a.entity} · {a.at}
                  </p>
                </div>
                <Badge tone={a.actorRole === "ADMIN" ? "indigo" : "blue"}>
                  {ROLE_LABEL[a.actorRole]}
                </Badge>
              </div>
            </li>
          ))}
        </ul>
      </Card>

      <p className="mt-4 text-xs text-slate-400">
        Nội dung thật sẽ gồm: ai / khi nào / entity / before-after / IP / user-agent /
        request-id (spec §7). Audit log là chỉ-ghi (append-only).
      </p>
    </>
  );
}
