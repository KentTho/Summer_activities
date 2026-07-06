"use client";

import { useActionState, useEffect, useRef } from "react";
import { Button, Card } from "@/components/ui";
import { createTemplate, type TemplateActionState } from "./actions";

const field =
  "h-10 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100";

export function CreateTemplateForm() {
  const [state, formAction, pending] = useActionState<TemplateActionState, FormData>(
    createTemplate,
    {},
  );
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state.ok) ref.current?.reset();
  }, [state.ok]);

  return (
    <Card title="Thêm mẫu báo cáo" className="mb-4">
      <form ref={ref} action={formAction} className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">
            Tên mẫu <span className="text-red-500">*</span>
          </label>
          <input name="name" required placeholder="VD: Danh sách điểm danh theo buổi" className={field} />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">
            Tên tệp .docx (tùy chọn)
          </label>
          <input name="file_name" placeholder="mau-diem-danh.docx" className={field} />
        </div>
        <div className="flex flex-wrap items-center gap-3 sm:col-span-2">
          <Button type="submit" disabled={pending}>
            {pending ? "Đang lưu…" : "Thêm mẫu"}
          </Button>
          <span className="text-xs text-slate-400">
            Chỉ nhận .docx (chặn .docm/macro). Upload tệp + render DOCX thật ở Prompt 08B.
          </span>
          {state.error ? (
            <span role="alert" className="text-sm text-red-600">
              {state.error}
            </span>
          ) : state.ok ? (
            <span className="text-sm text-green-600">Đã thêm mẫu.</span>
          ) : null}
        </div>
      </form>
    </Card>
  );
}
