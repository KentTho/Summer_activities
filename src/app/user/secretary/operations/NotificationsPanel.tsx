"use client";

/**
 * Panel "Thông báo phụ huynh" trong trang Vận hành (10F).
 * - Composer: chọn buổi → soạn → gửi (tái dùng server action notifySessionParents,
 *   người nhận do RLS/buổi quyết định — KHÔNG nới quyền).
 * - Lịch sử thông báo đã gửi.
 */
import { useActionState, useEffect, useState } from "react";
import { Badge, Button, Card, EmptyState, useToast } from "@/components/ui";
import { notifySessionParents, type NotifyState } from "../sessions/actions";
import { NOTIFICATION_SCOPE_LABEL } from "@/modules/notifications/domain/scope-type";

export interface NotifySessionOption {
  id: string;
  title: string;
  sessionDate: string;
  neighborhoods: string[];
  canceled: boolean;
}

export interface SentNotificationItem {
  id: string;
  title: string;
  body: string | null;
  scope: string;
  sessionTitle: string | null;
  createdAt: string;
}

export function NotificationsPanel({
  sessions,
  sent,
}: {
  sessions: NotifySessionOption[];
  sent: SentNotificationItem[];
}) {
  const [state, formAction, pending] = useActionState<NotifyState, FormData>(notifySessionParents, {});
  const { success, error } = useToast();
  const [selected, setSelected] = useState(sessions[0]?.id ?? "");

  useEffect(() => {
    if (state.ok) success(`Đã gửi thông báo tới ${state.count} phụ huynh.`);
    else if (state.error) error(state.error);
  }, [state, success, error]);

  const current = sessions.find((s) => s.id === selected);

  return (
    <div className="space-y-4">
      <Card title="Gửi thông báo cho phụ huynh theo buổi">
        {sessions.length === 0 ? (
          <p className="text-sm text-slate-500">
            Chưa có buổi sinh hoạt nào để gửi thông báo. Tạo buổi ở mục “Buổi sinh hoạt”.
          </p>
        ) : (
          <form action={formAction} className="space-y-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">Chọn buổi</label>
              <select
                name="session_id"
                value={selected}
                onChange={(e) => setSelected(e.target.value)}
                className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm"
              >
                {sessions.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.title} · {s.sessionDate}
                    {s.canceled ? " (đã hủy)" : ""}
                  </option>
                ))}
              </select>
              {current && current.neighborhoods.length > 0 ? (
                <p className="mt-1 flex flex-wrap gap-1 text-xs text-slate-400">
                  Khu phố nhận:
                  {current.neighborhoods.map((n) => (
                    <Badge key={n} tone="slate">{n}</Badge>
                  ))}
                </p>
              ) : null}
            </div>
            <input
              name="title"
              required
              defaultValue=""
              placeholder="Tiêu đề thông báo"
              className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm"
            />
            <textarea
              name="body"
              rows={2}
              placeholder="Nội dung (tùy chọn)…"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
            />
            <Button type="submit" size="sm" disabled={pending}>
              {pending ? "Đang gửi…" : "Gửi thông báo"}
            </Button>
          </form>
        )}
      </Card>

      <div>
        <p className="mb-2 text-sm font-medium text-slate-700">Thông báo đã gửi</p>
        {sent.length === 0 ? (
          <EmptyState icon="📣" title="Chưa gửi thông báo nào" />
        ) : (
          <div className="grid gap-3">
            {sent.map((n) => (
              <Card key={n.id}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-medium text-slate-900">{n.title}</p>
                    {n.body ? <p className="mt-1 text-sm text-slate-600">{n.body}</p> : null}
                    <p className="mt-1 text-xs text-slate-400">
                      {n.sessionTitle ? `${n.sessionTitle} · ` : ""}
                      {n.createdAt.slice(0, 16).replace("T", " ")}
                    </p>
                  </div>
                  <Badge tone="indigo">
                    {NOTIFICATION_SCOPE_LABEL[n.scope as keyof typeof NOTIFICATION_SCOPE_LABEL] ?? n.scope}
                  </Badge>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
