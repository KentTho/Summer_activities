"use client";

import { useActionState, useEffect, useRef } from "react";
import { Button } from "@/components/ui";
import { addRow, type ImportActionState } from "../actions";

const cls =
  "h-10 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100";

/** Thêm một dòng nháp: Họ tên (bắt buộc) · Ngày sinh · SĐT phụ huynh (+ phụ). */
export function AddRowForm({ batchId }: { batchId: string }) {
  const [state, formAction, pending] = useActionState<ImportActionState, FormData>(
    addRow,
    {},
  );
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.ok) formRef.current?.reset();
  }, [state.ok]);

  return (
    <form
      ref={formRef}
      action={formAction}
      className="grid gap-2 sm:grid-cols-3 lg:grid-cols-6"
    >
      <input type="hidden" name="batch_id" value={batchId} />
      <input name="full_name" required placeholder="Họ tên *" className={`${cls} lg:col-span-2`} />
      <input name="birth_date" type="date" className={cls} />
      <input name="guardian_phone" inputMode="tel" placeholder="SĐT phụ huynh" className={cls} />
      <input name="guardian_name" placeholder="Tên phụ huynh" className={cls} />
      <input name="school" placeholder="Trường" className={cls} />
      <div className="flex items-center gap-3 sm:col-span-3 lg:col-span-6">
        <Button type="submit" disabled={pending} className="h-9 px-4 text-sm">
          {pending ? "Đang thêm…" : "+ Thêm dòng"}
        </Button>
        {state.error ? (
          <span role="alert" className="text-sm text-red-600">
            {state.error}
          </span>
        ) : null}
      </div>
    </form>
  );
}
