import { Badge, Card } from "@/components/ui";
import { PageHeader } from "@/components/layout";
import { listTemplates } from "@/lib/data/templates";
import { CreateTemplateForm } from "./CreateTemplateForm";
import { toggleTemplate } from "./actions";

export const dynamic = "force-dynamic";

function formatSize(bytes: number | null): string {
  if (!bytes) return "";
  return `${(bytes / 1024).toFixed(0)}KB`;
}

export default async function AdminTemplatesPage() {
  const templates = await listTemplates();

  return (
    <>
      <PageHeader
        title="Mẫu báo cáo DOCX"
        description="Admin tải lên & duyệt mẫu (bật/tắt). Bí thư/Chi Đoàn chỉ thấy mẫu đang bật. Chỉ nhận .docx, chặn .docm/macro. Tệp lưu kho riêng tư."
      />

      <CreateTemplateForm />

      <p className="mb-2 text-sm text-slate-500">{templates.length} mẫu</p>
      <Card className="p-0">
        {templates.length === 0 ? (
          <p className="px-4 py-6 text-center text-sm text-slate-500">
            Chưa có mẫu nào. Tải lên mẫu phía trên.
          </p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {templates.map((t) => (
              <li key={t.id} className="flex items-center justify-between gap-3 px-4 py-3">
                <div className="min-w-0">
                  <p className="truncate font-medium text-slate-900">{t.name}</p>
                  <p className="mt-0.5 truncate text-xs text-slate-500">
                    cập nhật {t.updated_at.slice(0, 10)}
                    {t.hasFile ? ` · ${formatSize(t.sizeBytes)}` : " · chưa có tệp"}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge tone={t.active ? "green" : "slate"}>{t.active ? "Đang bật" : "Đã tắt"}</Badge>
                  {t.hasFile ? (
                    <a
                      href={`/admin/templates/${t.id}/download`}
                      className="rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-200"
                    >
                      Tải tệp
                    </a>
                  ) : null}
                  <form action={toggleTemplate}>
                    <input type="hidden" name="template_id" value={t.id} />
                    <input type="hidden" name="active" value={(!t.active).toString()} />
                    <button
                      type="submit"
                      className="rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-200"
                    >
                      {t.active ? "Tắt" : "Bật"}
                    </button>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <p className="mt-4 text-xs text-slate-400">
        Tệp mẫu lưu trong kho lưu trữ riêng tư (không có URL công khai). Chỉ Admin tải lại được.
      </p>
    </>
  );
}
