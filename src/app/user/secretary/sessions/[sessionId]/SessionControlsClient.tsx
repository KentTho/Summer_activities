"use client";

/**
 * Bảng điều khiển buổi (10E/10F) — chốt/mở/hủy/khôi phục/dời buổi.
 * 10F: chỉ hiện nút hợp logic theo trạng thái (đã chốt/hủy/đã qua) + giải thích khi ẩn.
 * Mỗi hành động dùng useActionState và hiện toast khi xong (thành công/thất bại).
 * Server action vẫn là nơi kiểm tra & ghi (qua RLS).
 */
import { useActionState, useEffect, type ReactNode } from "react";
import { Button, InlineAlert, useToast } from "@/components/ui";
import {
  closeSession,
  reopenSession,
  cancelSession,
  uncancelSession,
  rescheduleSession,
  type SessionActionState,
} from "../actions";
import { getSessionActionAvailability } from "./sessionActionRules";

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
  past,
  defaultDate,
  defaultTime,
}: {
  sessionId: string;
  closed: boolean;
  canceled: boolean;
  past: boolean;
  defaultDate: string;
  defaultTime: string;
}) {
  const a = getSessionActionAvailability({ closed, canceled, past });

  const noPrimaryButton = !a.canClose && !a.canReopen && !a.canCancel && !a.canUncancel;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        {a.canClose ? (
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

        {a.canReopen ? (
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

        {a.canCancel ? (
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
        ) : null}

        {a.canUncancel ? (
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
        ) : null}

        {noPrimaryButton ? (
          <span className="text-sm text-slate-400">Không có thao tác khả dụng.</span>
        ) : null}
      </div>

      {a.hiddenReason ? <InlineAlert tone="info">{a.hiddenReason}</InlineAlert> : null}

      {a.canReschedule ? (
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
      ) : null}
    </div>
  );
}
