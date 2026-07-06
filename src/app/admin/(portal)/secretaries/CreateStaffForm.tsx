"use client";

import { useActionState, useEffect, useRef } from "react";
import { Button, Card } from "@/components/ui";
import { STAFF_TITLES } from "@/modules/auth/domain/staff-title";
import { createStaff } from "./actions";
import type { AccountActionState } from "../account-actions";

const field =
  "h-10 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100";

export function CreateStaffForm() {
  const [state, formAction, pending] = useActionState<AccountActionState, FormData>(
    createStaff,
    {},
  );
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state.ok) ref.current?.reset();
  }, [state.ok]);

  return (
    <Card title="Tạo tài khoản Bí thư / Chi Đoàn" className="mb-4">
      <form ref={ref} action={formAction} className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">
            Tên đăng nhập / SĐT <span className="text-red-500">*</span>
          </label>
          <input name="identifier" required placeholder="VD: 0912345678" className={field} />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">
            Họ tên <span className="text-red-500">*</span>
          </label>
          <input name="full_name" required placeholder="Nguyễn Văn A" className={field} />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">Chức danh</label>
          <select name="staff_title" defaultValue={STAFF_TITLES[0]} className={field}>
            {STAFF_TITLES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">SĐT (tùy chọn)</label>
          <input name="phone" inputMode="tel" placeholder="Số liên hệ" className={field} />
        </div>
        <div className="flex flex-wrap items-center gap-3 sm:col-span-2">
          <Button type="submit" disabled={pending}>
            {pending ? "Đang tạo…" : "Tạo tài khoản"}
          </Button>
          {state.tempPassword ? (
            <span className="rounded bg-amber-50 px-2 py-1 font-mono text-xs text-amber-800">
              Mật khẩu tạm: <b>{state.tempPassword}</b> — gửi cho nhân sự &amp; yêu cầu đổi ngay
            </span>
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
