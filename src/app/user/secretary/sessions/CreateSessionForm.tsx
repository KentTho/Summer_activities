"use client";

import { useActionState } from "react";
import { Button, Card } from "@/components/ui";
import { createSession, type SessionActionState } from "./actions";
import type { NeighborhoodRow } from "@/lib/data/students";

const field =
  "h-10 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100";

/**
 * Tạo buổi sinh hoạt. Chọn ≥1 Khu phố (buổi chung nhiều Khu phố → JOINT).
 * RLS: chỉ gắn được Khu phố Bí thư phụ trách.
 */
export function CreateSessionForm({
  neighborhoods,
}: {
  neighborhoods: NeighborhoodRow[];
}) {
  const [state, formAction, pending] = useActionState<SessionActionState, FormData>(
    createSession,
    {},
  );

  return (
    <Card title="Tạo buổi sinh hoạt" className="mb-4">
      <form action={formAction} className="grid gap-3 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="mb-1 block text-xs font-medium text-slate-600">
            Tên buổi <span className="text-red-500">*</span>
          </label>
          <input name="title" required placeholder="VD: Sinh hoạt hè tuần 1" className={field} />
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">
            Ngày <span className="text-red-500">*</span>
          </label>
          <input name="session_date" type="date" required className={field} />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">Giờ bắt đầu</label>
          <input name="start_time" type="time" className={field} />
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">Loại buổi</label>
          <select name="session_type" defaultValue="REGULAR" className={field}>
            <option value="REGULAR">Buổi thường</option>
            <option value="JOINT">Buổi chung nhiều Khu phố</option>
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">Địa điểm</label>
          <input name="location" placeholder="VD: Nhà văn hóa Khu phố 1" className={field} />
        </div>

        <fieldset className="sm:col-span-2">
          <legend className="mb-1 block text-xs font-medium text-slate-600">
            Khu phố <span className="text-red-500">*</span>
          </legend>
          <div className="flex flex-wrap gap-3">
            {neighborhoods.map((n, i) => (
              <label key={n.id} className="flex items-center gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  name="neighborhood_ids"
                  value={n.id}
                  defaultChecked={neighborhoods.length === 1 || i === 0}
                  className="h-4 w-4 rounded border-slate-300"
                />
                {n.name}
              </label>
            ))}
          </div>
        </fieldset>

        <div className="flex items-center gap-3 sm:col-span-2">
          <Button type="submit" disabled={pending || neighborhoods.length === 0}>
            {pending ? "Đang tạo…" : "Tạo buổi"}
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
