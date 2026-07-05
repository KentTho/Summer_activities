import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge, Card } from "@/components/ui";
import { PageHeader } from "@/components/layout";
import {
  getImportBatch,
  listImportRows,
  rowData,
} from "@/lib/data/imports";
import { AddRowForm } from "./AddRowForm";
import { confirmBatch, deleteRow } from "../actions";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ batchId: string }>;
}

export default async function ImportBatchDetailPage({ params }: PageProps) {
  const { batchId } = await params;
  const batch = await getImportBatch(batchId);
  if (!batch) notFound();

  const rows = await listImportRows(batchId);
  const committed = batch.status === "COMMITTED";
  const createdCount = rows.filter((r) => r.created_student_id).length;
  const pendingCount = rows.length - createdCount;

  return (
    <>
      <PageHeader
        title={batch.file_name}
        description="Nhập/sửa dòng nháp rồi xác nhận để tạo học sinh thật. Xác nhận là bước bắt buộc — không auto-import."
      />

      <div className="mb-4 flex flex-wrap items-center gap-3 text-sm text-slate-500">
        <Link href="/user/secretary/import" className="text-indigo-600 hover:underline">
          ← Danh sách lô
        </Link>
        <Badge tone={committed ? "green" : "slate"}>
          {committed ? "Đã ghi nhận" : "Nháp"}
        </Badge>
        <span>{rows.length} dòng · đã tạo {createdCount}</span>
      </div>

      {!committed ? (
        <Card title="Thêm dòng nháp" className="mb-4">
          <AddRowForm batchId={batchId} />
        </Card>
      ) : null}

      <Card className="p-0">
        {rows.length === 0 ? (
          <p className="px-4 py-6 text-center text-sm text-slate-500">
            Chưa có dòng nào. Thêm dòng nháp phía trên.
          </p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {rows.map((r) => {
              const d = rowData(r);
              return (
                <li
                  key={r.id}
                  className="flex items-center justify-between gap-3 px-4 py-3"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium text-slate-900">
                      {d.full_name || "(thiếu họ tên)"}
                    </p>
                    <p className="mt-0.5 truncate text-xs text-slate-500">
                      {d.birth_date ? `Sinh ${d.birth_date} · ` : ""}
                      {d.guardian_phone ? `PH: ${d.guardian_phone}` : "chưa có SĐT PH"}
                      {d.school ? ` · ${d.school}` : ""}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    {r.created_student_id ? (
                      <Badge tone="green">Đã tạo</Badge>
                    ) : (
                      <Badge tone="slate">Nháp</Badge>
                    )}
                    {!committed && !r.created_student_id ? (
                      <form action={deleteRow}>
                        <input type="hidden" name="row_id" value={r.id} />
                        <input type="hidden" name="batch_id" value={batchId} />
                        <button
                          type="submit"
                          className="rounded-md px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50"
                        >
                          Xóa
                        </button>
                      </form>
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Card>

      {!committed && pendingCount > 0 ? (
        <form action={confirmBatch} className="mt-4">
          <input type="hidden" name="batch_id" value={batchId} />
          <button
            type="submit"
            className="inline-flex h-11 items-center rounded-lg bg-green-600 px-5 text-sm font-semibold text-white hover:bg-green-700"
          >
            Xác nhận & tạo {pendingCount} học sinh
          </button>
          <p className="mt-2 text-xs text-slate-400">
            Chỉ các dòng có Họ tên và chưa tạo mới được ghi vào danh sách học sinh
            (Khu phố theo lô).
          </p>
        </form>
      ) : null}
    </>
  );
}
