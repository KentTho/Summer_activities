"use client";

import { useActionState, useEffect, useRef } from "react";
import { Button, Card } from "@/components/ui";
import { createNeighborhood, type NeighborhoodActionState } from "./actions";

const field =
  "h-10 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100";

export function CreateNeighborhoodForm() {
  const [state, formAction, pending] = useActionState<NeighborhoodActionState, FormData>(
    createNeighborhood,
    {},
  );
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state.ok) ref.current?.reset();
  }, [state.ok]);

  return (
    <Card title="Thêm Khu phố" className="mb-4">
      <form ref={ref} action={formAction} className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">
            Mã Khu phố <span className="text-red-500">*</span>
          </label>
          <input name="code" required placeholder="VD: KP01" className={field} />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">
            Tên Khu phố <span className="text-red-500">*</span>
          </label>
          <input name="name" required placeholder="VD: Khu phố 1" className={field} />
        </div>
        <div className="flex flex-wrap items-center gap-3 sm:col-span-2">
          <Button type="submit" disabled={pending}>
            {pending ? "Đang lưu…" : "Thêm Khu phố"}
          </Button>
          {state.ok ? (
            <span className="text-sm text-green-700">Đã thêm Khu phố.</span>
          ) : state.error ? (
            <span role="alert" className="text-sm text-red-600">
              {state.error}
            </span>
          ) : null}
        </div>
      </form>
    </Card>
  );
}
