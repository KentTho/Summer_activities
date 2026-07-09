import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge, Card } from "@/components/ui";
import { PageHeader } from "@/components/layout";
import { isAiImportReady } from "@/lib/ai-import";
import {
  getImportBatch,
  listBatchImages,
  listImportRows,
  rowData,
} from "@/lib/data/imports";
import { getAiUsageToday } from "@/lib/data/ai-import-usage";
import { AddRowForm } from "./AddRowForm";
import { AiImportForm } from "./AiImportForm";
import { EditableRow } from "./EditableRow";
import { confirmBatch } from "../actions";

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

  const pendingRows = rows.filter((r) => !r.created_student_id);
  const reviewedPending = pendingRows.filter(
    (r) => r.reviewed && String(rowData(r).full_name ?? "").trim(),
  ).length;
  const unreviewedPending = pendingRows.length - reviewedPending;

  const aiReady = isAiImportReady();
  const [usage, images] = await Promise.all([getAiUsageToday(), listBatchImages(batchId)]);

  return (
    <>
      <PageHeader
        title={batch.file_name}
        description="AI đọc ảnh giấy tờ tạo dòng nháp → kiểm tra/sửa tay → xác nhận mới tạo học sinh. Xác nhận là bước bắt buộc — không auto-import."
      />

      <div className="mb-4 flex flex-wrap items-center gap-3 text-sm text-slate-500">
        <Link href="/user/secretary/import" className="text-indigo-600 hover:underline">
          ← Danh sách lô
        </Link>
        <Badge tone={committed ? "green" : "slate"}>
          {committed ? "Đã ghi nhận" : "Nháp"}
        </Badge>
        <span>
          {rows.length} dòng · đã tạo {createdCount}
          {unreviewedPending > 0 ? ` · ${unreviewedPending} chờ duyệt` : ""}
        </span>
      </div>

      {!committed ? (
        <>
          <AiImportForm
            batchId={batchId}
            ready={aiReady}
            remaining={usage.remaining}
            limit={usage.limit}
          />
          <Card title="Thêm dòng nháp (nhập tay)" className="mb-4">
            <AddRowForm batchId={batchId} />
          </Card>
        </>
      ) : null}

      {images.length > 0 ? (
        <Card title="Ảnh gốc đã lưu (riêng tư)" className="mb-4">
          <p className="mb-2 text-xs text-slate-500">
            Ảnh được lưu riêng tư để đối chiếu khi AI đọc sai. Không có liên kết công khai.
          </p>
          <ul className="divide-y divide-slate-100 text-sm">
            {images.map((img, i) => (
              <li key={img.id} className="flex items-center justify-between gap-3 py-2">
                <span className="min-w-0 truncate text-slate-700">Ảnh {i + 1}</span>
                <span className="flex shrink-0 items-center gap-3">
                  <span className="text-xs text-slate-400">
                    {img.sizeBytes ? `${Math.round(img.sizeBytes / 1024)}KB · ` : ""}
                    {img.createdAt.slice(0, 10)}
                  </span>
                  <a
                    href={`/user/secretary/import/${batchId}/documents/${img.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-medium text-indigo-600 hover:underline"
                  >
                    Xem ảnh gốc
                  </a>
                </span>
              </li>
            ))}
          </ul>
        </Card>
      ) : null}

      <Card className="p-0">
        {rows.length === 0 ? (
          <p className="px-4 py-6 text-center text-sm text-slate-500">
            Chưa có dòng nào. Dùng AI đọc ảnh hoặc nhập tay phía trên.
          </p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {rows.map((r) => {
              const d = rowData(r);
              const editable = !committed && !r.created_student_id;
              if (editable) {
                return (
                  <EditableRow
                    key={r.id}
                    rowId={r.id}
                    batchId={batchId}
                    data={d}
                    reviewed={r.reviewed}
                  />
                );
              }
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
                  {r.created_student_id ? (
                    <Badge tone="green">Đã tạo</Badge>
                  ) : (
                    <Badge tone="slate">Nháp</Badge>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </Card>

      {!committed && unreviewedPending > 0 ? (
        <p className="mt-3 text-xs text-amber-700">
          Còn {unreviewedPending} dòng AI chưa duyệt. Sửa và bấm “Lưu &amp; duyệt” ở từng
          dòng để đưa vào danh sách tạo học sinh.
        </p>
      ) : null}

      {!committed && reviewedPending > 0 ? (
        <form action={confirmBatch} className="mt-4">
          <input type="hidden" name="batch_id" value={batchId} />
          <button
            type="submit"
            className="inline-flex h-11 items-center rounded-lg bg-green-600 px-5 text-sm font-semibold text-white hover:bg-green-700"
          >
            Xác nhận &amp; tạo {reviewedPending} học sinh
          </button>
          <p className="mt-2 text-xs text-slate-400">
            Chỉ các dòng đã duyệt, có Họ tên và chưa tạo mới được ghi vào danh sách học sinh
            (Khu phố theo lô).
          </p>
        </form>
      ) : null}
    </>
  );
}
