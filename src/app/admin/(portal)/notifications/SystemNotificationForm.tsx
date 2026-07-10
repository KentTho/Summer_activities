"use client";

import { useActionState, useState } from "react";
import { Button, Card } from "@/components/ui";
import { sendSystemNotification, type SystemNotifState } from "./actions";

/** Admin gửi thông báo hệ thống (toàn bộ) hoặc theo Khu phố. */
export function SystemNotificationForm({
  neighborhoods,
}: {
  neighborhoods: { id: string; name: string; code: string }[];
}) {
  const [state, formAction, pending] = useActionState<SystemNotifState, FormData>(
    sendSystemNotification,
    {},
  );
  const [scope, setScope] = useState<"SYSTEM" | "NEIGHBORHOOD">("SYSTEM");

  return (
    <Card title="Soạn thông báo" className="mb-4">
      <form action={formAction} className="space-y-3">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Phạm vi gửi</label>
          <select
            name="scope"
            value={scope}
            onChange={(e) => setScope(e.target.value as "SYSTEM" | "NEIGHBORHOOD")}
            className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm"
          >
            <option value="SYSTEM">Toàn hệ thống (mọi tài khoản đang hoạt động)</option>
            <option value="NEIGHBORHOOD">Theo Khu phố (phụ huynh trong Khu phố)</option>
          </select>
        </div>

        {scope === "NEIGHBORHOOD" ? (
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Khu phố</label>
            <select
              name="neighborhood_id"
              className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm"
            >
              <option value="">— Chọn Khu phố —</option>
              {neighborhoods.map((n) => (
                <option key={n.id} value={n.id}>
                  {n.code} · {n.name}
                </option>
              ))}
            </select>
          </div>
        ) : null}

        <input
          name="title"
          required
          placeholder="Tiêu đề"
          className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm"
        />
        <textarea
          name="body"
          rows={3}
          placeholder="Nội dung (tùy chọn)…"
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
        />
        <div className="flex flex-wrap items-center gap-3">
          <Button type="submit" disabled={pending} className="h-9 px-4 text-sm">
            {pending ? "Đang gửi…" : "Gửi thông báo"}
          </Button>
          {state.error ? (
            <span role="alert" className="text-sm text-red-600">
              {state.error}
            </span>
          ) : null}
          {state.ok ? (
            <span className="text-sm text-green-600">Đã gửi tới {state.count} người nhận.</span>
          ) : null}
        </div>
        <p className="text-xs text-slate-400">
          Không gửi SMS/email thật. Người nhận xem trong mục “Thông báo” trên cổng của họ.
        </p>
      </form>
    </Card>
  );
}
