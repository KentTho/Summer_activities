"use client";

import { useActionState, useState } from "react";
import { Button, Card } from "@/components/ui";
import { createBatch, type ImportActionState } from "./actions";
import type { NeighborhoodRow } from "@/lib/data/students";

/**
 * Tạo lô import nháp. Có thể chọn ảnh/PDF giấy tờ để lấy TÊN tệp làm nhãn lô.
 * OCR nhận dạng + nhập/sửa dòng nháp thực hiện ở trang chi tiết của lô.
 */
export function CreateBatchForm({
  neighborhoods,
}: {
  neighborhoods: NeighborhoodRow[];
}) {
  const [state, formAction, pending] = useActionState<ImportActionState, FormData>(
    createBatch,
    {},
  );
  const [fileName, setFileName] = useState("");

  return (
    <Card title="Tạo lô import mới" className="mb-4">
      <form action={formAction} className="grid gap-3 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="mb-1 block text-xs font-medium text-slate-600">
            Ảnh/PDF giấy tờ (tùy chọn — chỉ lấy tên tệp; OCR ở bước sau)
          </label>
          <input
            type="file"
            accept="image/*,application/pdf"
            onChange={(e) => setFileName(e.target.files?.[0]?.name ?? "")}
            className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-slate-100 file:px-3 file:py-2 file:text-sm"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">
            Tên lô
          </label>
          <input
            name="file_name"
            value={fileName}
            onChange={(e) => setFileName(e.target.value)}
            placeholder="VD: Danh sách KP01 - đợt 1"
            className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">
            Khu phố <span className="text-red-500">*</span>
          </label>
          <select
            name="neighborhood_id"
            required
            defaultValue={neighborhoods[0]?.id ?? ""}
            className="h-10 w-full rounded-lg border border-slate-200 px-2 text-sm"
          >
            {neighborhoods.map((n) => (
              <option key={n.id} value={n.id}>
                {n.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-3 sm:col-span-2">
          <Button type="submit" disabled={pending || neighborhoods.length === 0}>
            {pending ? "Đang tạo…" : "Tạo lô nháp"}
          </Button>
          {state.error ? (
            <span role="alert" className="text-sm text-red-600">
              {state.error}
            </span>
          ) : null}
        </div>
      </form>
    </Card>
  );
}
