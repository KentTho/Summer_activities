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
          <input name="name" required placeholder="VD: Mẫu danh sách điểm danh" className={field} />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">
            Tệp mẫu .docx <span className="text-red-500">*</span>
          </label>
          <input
            name="file"
            type="file"
            required
            accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-slate-100 file:px-3 file:py-2 file:text-xs file:font-medium file:text-slate-700"
          />
        </div>
        <div className="flex flex-wrap items-center gap-3 sm:col-span-2">
          <Button type="submit" disabled={pending}>
            {pending ? "Đang tải lên…" : "Tải lên mẫu"}
          </Button>
          <span className="text-xs text-slate-400">
            Chỉ nhận tệp .docx (chặn .docm/macro), tối đa 10MB. Tệp lưu ở kho riêng tư.
          </span>
          {state.error ? (
            <span role="alert" className="text-sm text-red-600">
              {state.error}
            </span>
          ) : state.ok ? (
            <span className="text-sm text-green-600">Đã tải lên mẫu.</span>
          ) : null}
        </div>
      </form>
    </Card>
  );
}
