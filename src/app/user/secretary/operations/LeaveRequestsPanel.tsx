"use client";

/**
 * Panel "Đơn xin nghỉ" trong trang Vận hành (10F).
 * Duyệt/từ chối qua server action trả trạng thái → toast; không reload thủ công.
 */
import { useActionState, useEffect, useState, type ReactNode } from "react";
import { Badge, Card, EmptyState, useToast } from "@/components/ui";
import { LEAVE_STATUS, LEAVE_STATUS_LABEL, LEAVE_TONE } from "@/modules/leave-requests/domain/leave-status";
import { acknowledgeLeave, rejectLeave, type LeaveActionState } from "../leave-requests/actions";

export interface LeavePanelItem {
  id: string;
  studentName: string;
  sessionTitle: string | null;
  sessionDate: string | null;
  reason: string | null;
  createdAt: string;
  status: string;
}

type Action = (prev: LeaveActionState, formData: FormData) => Promise<LeaveActionState>;

function LeaveActionForm({
  action,
  leaveId,
  children,
}: {
  action: Action;
  leaveId: string;
  children: (pending: boolean) => ReactNode;
}) {
  const [state, formAction, pending] = useActionState<LeaveActionState, FormData>(action, {});
  const { success, error } = useToast();
  useEffect(() => {
    if (state.ok && state.message) success(state.message);
    else if (state.error) error(state.error);
  }, [state, success, error]);
  return (
    <form action={formAction}>
      <input type="hidden" name="leave_id" value={leaveId} />
      {children(pending)}
    </form>
  );
}

export function LeaveRequestsPanel({ requests }: { requests: LeavePanelItem[] }) {
  const [filter, setFilter] = useState<"ALL" | "PENDING">("PENDING");
  const shown = requests.filter((l) =>
    filter === "PENDING" ? l.status === LEAVE_STATUS.SUBMITTED : true,
  );
  const pendingCount = requests.filter((l) => l.status === LEAVE_STATUS.SUBMITTED).length;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setFilter("PENDING")}
          className={
            "h-8 rounded-lg px-3 text-xs font-medium " +
            (filter === "PENDING" ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200")
          }
        >
          Chờ xử lý ({pendingCount})
        </button>
        <button
          type="button"
          onClick={() => setFilter("ALL")}
          className={
            "h-8 rounded-lg px-3 text-xs font-medium " +
            (filter === "ALL" ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200")
          }
        >
          Tất cả ({requests.length})
        </button>
      </div>

      {shown.length === 0 ? (
        <EmptyState
          icon="📝"
          title={filter === "PENDING" ? "Không có đơn chờ xử lý" : "Chưa có đơn xin nghỉ nào"}
          description="Phụ huynh gửi đơn trước buổi; duyệt tại đây sẽ gợi ý điểm danh 'Nghỉ có phép'."
        />
      ) : (
        <div className="grid gap-3">
          {shown.map((l) => {
            const pending = l.status === LEAVE_STATUS.SUBMITTED;
            return (
              <Card key={l.id}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-medium text-slate-900">{l.studentName}</p>
                    <p className="mt-1 text-sm text-slate-500">
                      {l.sessionTitle
                        ? `${l.sessionTitle}${l.sessionDate ? ` · ${l.sessionDate}` : ""}`
                        : "Không gắn buổi cụ thể"}
                    </p>
                    <p className="mt-1 text-sm text-slate-600">Lý do: {l.reason || "(không ghi)"}</p>
                    <p className="mt-1 text-xs text-slate-400">Gửi ngày {l.createdAt.slice(0, 10)}</p>
                  </div>
                  <Badge tone={LEAVE_TONE[l.status as keyof typeof LEAVE_TONE]}>
                    {LEAVE_STATUS_LABEL[l.status as keyof typeof LEAVE_STATUS_LABEL]}
                  </Badge>
                </div>
                {pending ? (
                  <div className="mt-3 flex gap-1.5">
                    <LeaveActionForm action={acknowledgeLeave} leaveId={l.id}>
                      {(p) => (
                        <button
                          type="submit"
                          disabled={p}
                          className="inline-flex h-8 items-center rounded-lg bg-emerald-600 px-3 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                        >
                          {p ? "Đang lưu…" : "Ghi nhận có phép"}
                        </button>
                      )}
                    </LeaveActionForm>
                    <LeaveActionForm action={rejectLeave} leaveId={l.id}>
                      {(p) => (
                        <button
                          type="submit"
                          disabled={p}
                          className="inline-flex h-8 items-center rounded-lg bg-slate-100 px-3 text-xs font-medium text-slate-700 hover:bg-slate-200 disabled:opacity-50"
                        >
                          {p ? "Đang lưu…" : "Từ chối"}
                        </button>
                      )}
                    </LeaveActionForm>
                  </div>
                ) : null}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
