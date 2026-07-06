import { Badge, Card } from "@/components/ui";
import { PageHeader } from "@/components/layout";
import { listActiveTemplates } from "@/lib/data/templates";

export const dynamic = "force-dynamic";

export default async function SecretaryReportsPage() {
  const templates = await listActiveTemplates();

  return (
    <>
      <PageHeader
        title="Báo cáo"
        description="Chọn mẫu báo cáo do Admin duyệt. Render & tải DOCX thật bật ở Prompt 08B."
      />

      {templates.length === 0 ? (
        <Card>
          <p className="text-sm text-slate-500">
            Chưa có mẫu báo cáo nào được bật. Admin quản lý mẫu ở cổng Quản trị.
          </p>
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {templates.map((t) => (
            <Card key={t.id}>
              <div className="flex items-start justify-between gap-2">
                <p className="font-medium text-slate-900">{t.name}</p>
                <Badge tone="slate">DOCX</Badge>
              </div>
              <p className="mt-1 text-sm text-slate-500">
                Mẫu đang bật. Xuất DOCX thật (render server-side) sẽ có ở Prompt 08B.
              </p>
              <button
                disabled
                className="mt-3 h-9 rounded-lg bg-slate-100 px-3 text-xs font-medium text-slate-500"
              >
                Xuất DOCX (Prompt 08B)
              </button>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
