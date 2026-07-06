"use client";

import { useActionState, useEffect, useRef } from "react";
import { Button, Card } from "@/components/ui";
import { createParent } from "./actions";
import type { AccountActionState } from "../account-actions";

const field =
  "h-10 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100";

export function CreateParentForm() {
  const [state, formAction, pending] = useActionState<AccountActionState, FormData>(
    createParent,
    {},
  );
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state.ok) ref.current?.reset();
  }, [state.ok]);

  return (
    <Card title="Tạo tài khoản Phụ huynh / Học sinh" className="mb-4">
      <form ref={ref} action={formAction} className="grid gap-3 sm:grid-cols-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">
            Tên đăng nhập / SĐT <span className="text-red-500">*</span>
          </label>
          <input name="identifier" required placeholder="VD: 0987654321" className={field} />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">
            Họ tên phụ huynh <span className="text-red-500">*</span>
          </label>
          <input name="full_name" required placeholder="Trần Thị B" className={field} />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">SĐT (tùy chọn)</label>
          <input name="phone" inputMode="tel" placeholder="Số liên hệ" className={field} />
        </div>
        <div className="flex flex-wrap items-center gap-3 sm:col-span-3">
          <Button type="submit" disabled={pending}>
            {pending ? "Đang tạo…" : "Tạo tài khoản"}
          </Button>
          <span className="text-xs text-slate-400">Liên kết học sinh ở danh sách bên dưới.</span>
          {state.tempPassword ? (
            <span className="rounded bg-amber-50 px-2 py-1 font-mono text-xs text-amber-800">
              Mật khẩu tạm: <b>{state.tempPassword}</b> — gửi cho phụ huynh &amp; yêu cầu đổi ngay
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
