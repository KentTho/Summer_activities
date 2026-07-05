"use client";

import type { ReactNode } from "react";
import { useActionState } from "react";
import { Button } from "@/components/ui";
import type { SignInState } from "@/lib/auth/actions";

type SignInAction = (
  prev: SignInState,
  formData: FormData,
) => Promise<SignInState>;

interface LoginFormProps {
  /** Server Action đăng nhập cho cổng tương ứng (signInAdmin / signInUser). */
  action: SignInAction;
  accountLabel: string;
  accountPlaceholder: string;
  submitLabel: string;
  /** Ghi chú dưới form. */
  footer?: ReactNode;
}

/**
 * Form đăng nhập thật (Prompt 05) — gọi Supabase Auth qua Server Action.
 * Dùng useActionState để hiển thị lỗi và trạng thái pending; redirect do action xử lý.
 */
export function LoginForm({
  action,
  accountLabel,
  accountPlaceholder,
  submitLabel,
  footer,
}: LoginFormProps) {
  const [state, formAction, pending] = useActionState<SignInState, FormData>(
    action,
    {},
  );

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <form action={formAction} className="space-y-4">
        <div>
          <label
            htmlFor="email"
            className="mb-1 block text-sm font-medium text-slate-700"
          >
            {accountLabel}
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            placeholder={accountPlaceholder}
            className="h-11 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
          />
        </div>
        <div>
          <label
            htmlFor="password"
            className="mb-1 block text-sm font-medium text-slate-700"
          >
            Mật khẩu
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            autoComplete="current-password"
            placeholder="••••••••"
            className="h-11 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
          />
        </div>

        {state.error ? (
          <p
            role="alert"
            className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700"
          >
            {state.error}
          </p>
        ) : null}

        <Button type="submit" disabled={pending} className="w-full">
          {pending ? "Đang đăng nhập…" : submitLabel}
        </Button>
      </form>
      {footer ? <div className="mt-4 text-xs text-slate-400">{footer}</div> : null}
    </div>
  );
}
