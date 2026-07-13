"use client";

/**
 * Bảng điều khiển buổi (10E) — chốt/mở/hủy/khôi phục/dời buổi.
 * Mỗi hành động dùng useActionState và hiện toast khi xong (thành công/thất bại).
 * Không đổi nghiệp vụ: server action vẫn là nơi kiểm tra & ghi (qua RLS).
 */
import { useActionState, useEffect, type ReactNode } from "react";
import { Button, useToast } from "@/components/ui";
import {
  closeSession,
  reopenSession,
  cancelSession,
  uncancelSession,
  rescheduleSession,
  type SessionActionState,
} from "../actions";

type Action = (
  prev: SessionActionState,
  formData: FormData,
) => Promise<SessionActionState>;

/** Form bọc 1 hành động: tự toast theo kết quả. */
function ActionForm({
  action,
  children,
  className,
}: {
  action: Action;
  children: (pending: boolean) => ReactNode;
  className?: string;
}) {
  const [state, formAction, pending] = useActionState<SessionActionState, FormData>(action, {});
  const { success, error } = useToast();

  useEffect(() => {
    if (state.ok && state.message) success(state.message);
    else if (state.error) error(state.error);
  }, [state, success, error]);

  return (
    <form action={formAction} className={className}>
      {children(pending)}
    </form>
  );
}

export function SessionControlsClient({
  sessionId,
  closed,
  canceled,
  defaultDate,
  defaultTime,
}: {
  sessionId: string;
  closed: boolean;
  canceled: boolean;
  defaultDate: string;
  defaultTime: string;
}) {
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        {!canceled && !closed ? (
          <ActionForm action={closeSession}>
            {(pending) => (
              <>
                <input type="hidden" name="session_id" value={sessionId} />
                <Button type="submit" size="sm" disabled={pending} className="bg-emerald-600 hover:bg-emerald-700">
                  {pending ? "Đang chốt…" : "Chốt buổi"}
                </Button>
              </>
            )}
          </ActionForm>
        ) : null}

        {closed && !canceled ? (
          <ActionForm action={reopenSession}>
            {(pending) => (
              <>
                <input type="hidden" name="session_id" value={sessionId} />
                <Button type="submit" size="sm" variant="secondary" disabled={pending}>
                  {pending ? "Đang mở…" : "Mở lại buổi"}
                </Button>
              </>
            )}
          </ActionForm>
        ) : null}

        {!canceled ? (
          <ActionForm action={cancelSession}>
            {(pending) => (
              <>
                <input type="hidden" name="session_id" value={sessionId} />
                <Button type="submit" size="sm" variant="danger" disabled={pending}>
                  {pending ? "Đang hủy…" : "Dừng / hủy buổi"}
                </Button>
              </>
            )}
          </ActionForm>
        ) : (
          <ActionForm action={uncancelSession}>
            {(pending) => (
              <>
                <input type="hidden" name="session_id" value={sessionId} />
                <Button type="submit" size="sm" variant="secondary" disabled={pending}>
                  {pending ? "Đang khôi phục…" : "Khôi phục buổi"}
                </Button>
              </>
            )}
          </ActionForm>
        )}
      </div>

      <ActionForm action={rescheduleSession} className="flex flex-wrap items-end gap-2 border-t border-slate-100 pt-3">
        {(pending) => (
          <>
            <input type="hidden" name="session_id" value={sessionId} />
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">Dời sang ngày</label>
              <input
                name="session_date"
                type="date"
                required
                defaultValue={defaultDate}
                className="h-9 rounded-lg border border-slate-200 px-2 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">Giờ</label>
              <input
                name="start_time"
                type="time"
                defaultValue={defaultTime}
                className="h-9 rounded-lg border border-slate-200 px-2 text-sm"
              />
            </div>
            <Button type="submit" size="sm" disabled={pending}>
              {pending ? "Đang dời…" : "Dời buổi"}
            </Button>
          </>
        )}
      </ActionForm>
    </div>
  );
}
