"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui";
import { changePassword, type ChangePasswordState } from "./actions";

const field =
  "h-11 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100";

export function ChangePasswordForm({ forced }: { forced: boolean }) {
  const [state, formAction, pending] = useActionState<ChangePasswordState, FormData>(
    changePassword,
    {},
  );

  return (
    <form action={formAction} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      {forced ? (
        <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
          Bạn cần đổi mật khẩu tạm trước khi tiếp tục sử dụng hệ thống.
        </p>
      ) : null}
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Mật khẩu mới</label>
        <input name="password" type="password" required minLength={8} autoComplete="new-password" className={field} />
        <p className="mt-1 text-xs text-slate-400">Tối thiểu 8 ký tự. Không dùng lại mật khẩu tạm.</p>
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Xác nhận mật khẩu mới</label>
        <input name="confirm" type="password" required minLength={8} autoComplete="new-password" className={field} />
      </div>
      {state.error ? (
        <p role="alert" className="text-sm text-red-600">
          {state.error}
        </p>
      ) : null}
      <Button type="submit" disabled={pending} className="w-full justify-center">
        {pending ? "Đang lưu…" : "Đổi mật khẩu"}
      </Button>
    </form>
  );
}
