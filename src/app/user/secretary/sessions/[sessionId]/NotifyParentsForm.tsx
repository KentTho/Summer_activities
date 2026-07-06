"use client";

import { useActionState } from "react";
import { Button, Card } from "@/components/ui";
import { notifySessionParents, type NotifyState } from "../actions";

/** Gửi thông báo cho phụ huynh liên quan buổi (scope SESSION). */
export function NotifyParentsForm({
  sessionId,
  defaultTitle,
}: {
  sessionId: string;
  defaultTitle: string;
}) {
  const [state, formAction, pending] = useActionState<NotifyState, FormData>(
    notifySessionParents,
    {},
  );

  return (
    <Card title="Gửi thông báo cho phụ huynh" className="mb-4">
      <form action={formAction} className="space-y-3">
        <input type="hidden" name="session_id" value={sessionId} />
        <input
          name="title"
          required
          defaultValue={defaultTitle}
          placeholder="Tiêu đề"
          className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm"
        />
        <textarea
          name="body"
          rows={2}
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
            <span className="text-sm text-green-600">Đã gửi tới {state.count} phụ huynh.</span>
          ) : null}
        </div>
      </form>
    </Card>
  );
}
