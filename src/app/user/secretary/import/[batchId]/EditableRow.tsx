"use client";

import { useActionState } from "react";
import { Badge, Button } from "@/components/ui";
import { updateRow, deleteRow, type ImportActionState } from "../actions";

const cls =
  "h-10 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100";

/** Dữ liệu dòng nháp (plain — truyền từ server page, không import module server). */
export interface EditableRowData {
  full_name?: string;
  birth_date?: string;
  guardian_phone?: string;
  guardian_name?: string;
  school?: string;
}

/**
 * Một dòng nháp có thể SỬA (kiểm tra/sửa kết quả OCR trước khi tạo học sinh).
 * "Lưu & duyệt" đánh dấu reviewed=true; chỉ dòng đã duyệt mới được confirm tạo HS.
 * Dòng chưa duyệt (OCR) hiện nhãn "AI đọc — cần kiểm tra".
 */
export function EditableRow({
  rowId,
  batchId,
  data,
  reviewed,
}: {
  rowId: string;
  batchId: string;
  data: EditableRowData;
  reviewed: boolean;
}) {
  const [state, formAction, pending] = useActionState<ImportActionState, FormData>(
    updateRow,
    {},
  );

  return (
    <li className="px-4 py-3">
      <form
        action={formAction}
        className="grid items-center gap-2 sm:grid-cols-3 lg:grid-cols-6"
      >
        <input type="hidden" name="row_id" value={rowId} />
        <input type="hidden" name="batch_id" value={batchId} />
        <input
          name="full_name"
          required
          defaultValue={data.full_name ?? ""}
          placeholder="Họ tên *"
          className={`${cls} lg:col-span-2`}
        />
        <input name="birth_date" type="date" defaultValue={data.birth_date ?? ""} className={cls} />
        <input
          name="guardian_phone"
          inputMode="tel"
          defaultValue={data.guardian_phone ?? ""}
          placeholder="SĐT phụ huynh"
          className={cls}
        />
        <input
          name="guardian_name"
          defaultValue={data.guardian_name ?? ""}
          placeholder="Tên phụ huynh"
          className={cls}
        />
        <input name="school" defaultValue={data.school ?? ""} placeholder="Trường" className={cls} />

        <div className="flex flex-wrap items-center gap-2 sm:col-span-3 lg:col-span-6">
          {reviewed ? (
            <Badge tone="green">Đã duyệt</Badge>
          ) : (
            <Badge tone="amber">AI đọc — cần kiểm tra</Badge>
          )}
          <Button type="submit" disabled={pending} className="h-9 px-4 text-sm">
            {pending ? "Đang lưu…" : "Lưu & duyệt"}
          </Button>
          <button
            type="submit"
            formAction={deleteRow}
            className="rounded-md px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50"
          >
            Xóa
          </button>
          {state.error ? (
            <span role="alert" className="text-sm text-red-600">
              {state.error}
            </span>
          ) : null}
          {state.ok ? <span className="text-sm text-green-600">Đã lưu.</span> : null}
        </div>
      </form>
    </li>
  );
}
