import Link from "next/link";
import { Badge, Button, Card } from "@/components/ui";
import { PageHeader } from "@/components/layout";
import {
  IMPORT_BATCHES,
  IMPORT_STATUS_LABEL,
  IMPORT_STATUS_TONE,
} from "@/lib/mock";

export default function SecretaryImportPage() {
  return (
    <>
      <PageHeader
        title="Nhập giấy tờ"
        description="Tải ảnh/PDF danh sách → OCR (tuỳ chọn) → duyệt tay → ghi nhận. Không auto-import."
      />

      <Card className="mb-4 border-dashed">
        <div className="flex flex-col items-center gap-2 py-4 text-center">
          <span className="text-2xl" aria-hidden>📄</span>
          <p className="text-sm text-slate-600">Kéo thả ảnh/PDF danh sách vào đây</p>
          <p className="text-xs text-slate-400">Chỉ nhận ảnh/PDF · quét vào vùng staging, chưa ghi vào hồ sơ thật</p>
          <Button disabled variant="secondary" className="mt-1 h-9 px-3 text-xs">
            Chọn tệp (chưa kết nối)
          </Button>
        </div>
      </Card>

      <p className="mb-2 text-sm font-medium text-slate-700">Lô import gần đây</p>
      <Card className="p-0">
        <ul className="divide-y divide-slate-100">
          {IMPORT_BATCHES.map((b) => (
            <li key={b.id} className="flex items-center justify-between gap-3 px-4 py-3">
              <div className="min-w-0">
                <p className="truncate font-medium text-slate-900">{b.fileName}</p>
                <p className="mt-0.5 text-xs text-slate-500">
                  {b.source === "OCR" ? "OCR" : "Nhập tay"} · {b.uploadedAt} · Đã duyệt {b.reviewedRows}/{b.totalRows} dòng
                </p>
              </div>
              <Badge tone={IMPORT_STATUS_TONE[b.status]}>{IMPORT_STATUS_LABEL[b.status]}</Badge>
            </li>
          ))}
        </ul>
      </Card>

      <p className="mt-4 text-xs text-slate-400">
        Quy trình chi tiết: xem{" "}
        <Link href="/gioi-thieu" className="text-indigo-600 hover:underline">tài liệu</Link>{" "}
        (staging-first, duyệt tay bắt buộc).
      </p>
    </>
  );
}
