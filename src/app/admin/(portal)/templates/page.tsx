import { Badge, Button, Card } from "@/components/ui";
import { PageHeader } from "@/components/layout";
import { DOCX_TEMPLATES } from "@/lib/mock";

export default function AdminTemplatesPage() {
  return (
    <>
      <PageHeader
        title="Mẫu báo cáo DOCX"
        description="Admin quản lý template DOCX dùng cho xuất báo cáo. Chỉ nhận .docx, chặn macro (.docm)."
      />

      <Card className="mb-4 border-dashed">
        <div className="flex flex-col items-center gap-2 py-4 text-center">
          <span className="text-2xl" aria-hidden>📄</span>
          <p className="text-sm text-slate-600">Tải lên template .docx mới</p>
          <p className="text-xs text-slate-400">Kiểm mime + đuôi + kích thước + hash · lưu bucket riêng, không public</p>
          <Button disabled variant="secondary" className="mt-1 h-9 px-3 text-xs">
            Chọn tệp .docx (chưa kết nối)
          </Button>
        </div>
      </Card>

      <Card className="p-0">
        <ul className="divide-y divide-slate-100">
          {DOCX_TEMPLATES.map((t) => (
            <li key={t.id} className="flex items-center justify-between gap-3 px-4 py-3">
              <div className="min-w-0">
                <p className="truncate font-medium text-slate-900">{t.name}</p>
                <p className="mt-0.5 truncate text-xs text-slate-500">{t.fileName} · cập nhật {t.updatedAt}</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge tone={t.active ? "green" : "slate"}>{t.active ? "Đang dùng" : "Ẩn"}</Badge>
                <Button disabled variant="ghost" className="h-8 px-2 text-xs">Thay tệp</Button>
              </div>
            </li>
          ))}
        </ul>
      </Card>
    </>
  );
}
