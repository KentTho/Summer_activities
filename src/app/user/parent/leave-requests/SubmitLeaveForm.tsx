"use client";

import { useActionState, useEffect, useRef } from "react";
import { Button, Card } from "@/components/ui";
import { submitLeaveRequest, type LeaveActionState } from "./actions";
import type { ChildOption } from "@/lib/data/parent";

export interface SessionOption {
  id: string;
  label: string;
}

/** Phụ huynh gửi đơn xin nghỉ cho một con + (tùy chọn) một buổi cụ thể. */
export function SubmitLeaveForm({
  kids,
  sessions,
}: {
  kids: ChildOption[];
  sessions: SessionOption[];
}) {
  const [state, formAction, pending] = useActionState<LeaveActionState, FormData>(
    submitLeaveRequest,
    {},
  );
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.ok) formRef.current?.reset();
  }, [state.ok]);

  if (kids.length === 0) {
    return (
      <Card className="mb-4 border-amber-200 bg-amber-50">
        <p className="text-sm text-amber-800">
          Tài khoản của bạn chưa được liên kết với học sinh nào nên chưa thể gửi đơn.
          Vui lòng liên hệ Bí thư Khu phố để liên kết.
        </p>
      </Card>
    );
  }

  return (
    <Card title="Gửi đơn xin nghỉ" className="mb-4">
      <form ref={formRef} action={formAction} className="space-y-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">Học sinh</label>
          <select
            name="student_id"
            required
            className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm"
          >
            {kids.map((c) => (
              <option key={c.id} value={c.id}>
                {c.fullName}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">
            Buổi sinh hoạt (tùy chọn)
          </label>
          <select
            name="session_id"
            defaultValue=""
            className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm"
          >
            <option value="">— Không gắn buổi cụ thể —</option>
            {sessions.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">Lý do</label>
          <textarea
            name="reason"
            rows={3}
            placeholder="Nhập lý do xin nghỉ…"
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
          />
        </div>
        <div className="flex items-center gap-3">
          <Button type="submit" disabled={pending} className="h-9 px-4 text-sm">
            {pending ? "Đang gửi…" : "Gửi đơn"}
          </Button>
          {state.error ? (
            <span role="alert" className="text-sm text-red-600">
              {state.error}
            </span>
          ) : null}
          {state.ok ? (
            <span className="text-sm text-green-600">Đã gửi đơn. Chờ Bí thư xử lý.</span>
          ) : null}
        </div>
      </form>
    </Card>
  );
}
