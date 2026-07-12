"use client";

import type { ReactNode } from "react";
import { useActionState } from "react";
import Link from "next/link";
import { Button, FormField, InlineAlert, fieldClass } from "@/components/ui";
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
  /** Link "Quên mật khẩu?" (tùy chọn) — trỏ tới trang gửi yêu cầu cấp lại. */
  forgotHref?: string;
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
  forgotHref,
  footer,
}: LoginFormProps) {
  const [state, formAction, pending] = useActionState<SignInState, FormData>(
    action,
    {},
  );

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <form action={formAction} className="space-y-4">
        <FormField label={accountLabel} htmlFor="identifier" required>
          <input
            id="identifier"
            name="identifier"
            type="text"
            required
            autoComplete="username"
            placeholder={accountPlaceholder}
            className={fieldClass}
          />
        </FormField>
        <FormField label="Mật khẩu" htmlFor="password" required>
          <input
            id="password"
            name="password"
            type="password"
            required
            autoComplete="current-password"
            placeholder="••••••••"
            className={fieldClass}
          />
        </FormField>

        {state.error ? <InlineAlert tone="error">{state.error}</InlineAlert> : null}

        <Button type="submit" disabled={pending} className="w-full">
          {pending ? "Đang đăng nhập…" : submitLabel}
        </Button>

        {forgotHref ? (
          <p className="text-center text-sm">
            <Link href={forgotHref} className="text-indigo-600 hover:underline">
              Quên mật khẩu?
            </Link>
          </p>
        ) : null}
      </form>
      {footer ? <div className="mt-4 text-xs text-slate-400">{footer}</div> : null}
    </div>
  );
}
