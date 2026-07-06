import Link from "next/link";
import type { BadgeTone } from "@/components/ui";
import { Badge, Card } from "@/components/ui";
import { PageHeader } from "@/components/layout";
import { listImportBatches } from "@/lib/data/imports";
import { listNeighborhoodsInScope } from "@/lib/data/students";
import { CreateBatchForm } from "./CreateBatchForm";

export const dynamic = "force-dynamic";

const STATUS_LABEL: Record<string, string> = {
  DRAFT: "Nháp",
  REVIEWING: "Đang duyệt",
  COMMITTED: "Đã ghi nhận",
  REJECTED: "Từ chối",
};
const STATUS_TONE: Record<string, BadgeTone> = {
  DRAFT: "slate",
  REVIEWING: "blue",
  COMMITTED: "green",
  REJECTED: "amber",
};

export default async function SecretaryImportPage() {
  const [batches, neighborhoods] = await Promise.all([
    listImportBatches(),
    listNeighborhoodsInScope(),
  ]);

  return (
    <>
      <PageHeader
        title="Nhập giấy tờ (staging)"
        description="Tạo lô → OCR ảnh giấy tờ hoặc nhập tay → kiểm tra/sửa → xác nhận mới tạo học sinh. Không auto-import."
      />

      {neighborhoods.length === 0 ? (
        <Card className="mb-4 border-amber-200 bg-amber-50">
          <p className="text-sm text-amber-800">
            Bạn chưa được gán Khu phố phụ trách nên chưa thể tạo lô import.
          </p>
        </Card>
      ) : (
        <CreateBatchForm neighborhoods={neighborhoods} />
      )}

      <p className="mb-2 text-sm font-medium text-slate-700">Lô import gần đây</p>
      <Card className="p-0">
        {batches.length === 0 ? (
          <p className="px-4 py-6 text-center text-sm text-slate-500">
            Chưa có lô import nào.
          </p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {batches.map((b) => (
              <li key={b.id}>
                <Link
                  href={`/user/secretary/import/${b.id}`}
                  className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-slate-50"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium text-slate-900">
                      {b.file_name}
                    </p>
                    <p className="mt-0.5 text-xs text-slate-500">
                      {b.source === "OCR" ? "OCR" : "Nhập tay"} ·{" "}
                      {b.created_at.slice(0, 10)}
                    </p>
                  </div>
                  <Badge tone={STATUS_TONE[b.status] ?? "slate"}>
                    {STATUS_LABEL[b.status] ?? b.status}
                  </Badge>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </>
  );
}
