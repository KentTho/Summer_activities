"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui";
import { submitForgotPassword, type ForgotPasswordState } from "./actions";

const NEUTRAL =
  "Nếu tài khoản tồn tại, Quản trị viên sẽ xử lý yêu cầu và cấp lại mật khẩu tạm cho bạn. Vui lòng liên hệ Quản trị/Bí thư để nhận mật khẩu tạm.";

/**
 * Form gửi yêu cầu quên mật khẩu. Không tự đổi mật khẩu; chỉ tạo yêu cầu cho Admin.
 * Thông báo sau khi gửi luôn TRUNG LẬP — không tiết lộ tài khoản tồn tại hay không.
 */
export function ForgotPasswordForm({
  defaultPortal,
  backHref,
}: {
  defaultPortal: "USER";
  backHref: string;
}) {
  const [state, formAction, pending] = useActionState<ForgotPasswordState, FormData>(
    submitForgotPassword,
    {},
  );

  if (state.done) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="rounded-lg bg-green-50 px-3 py-3 text-sm text-green-800">{NEUTRAL}</p>
        <p className="mt-4 text-center text-sm">
          <Link href={backHref} className="text-indigo-600 hover:underline">
            ← Quay lại đăng nhập
          </Link>
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <form action={formAction} className="space-y-4">
        <div>
          <label htmlFor="identifier" className="mb-1 block text-sm font-medium text-slate-700">
            Số điện thoại hoặc tài khoản
          </label>
          <input
            id="identifier"
            name="identifier"
            type="text"
            required
            autoComplete="username"
            placeholder="Số điện thoại hoặc tài khoản"
            className="h-11 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
          />
        </div>
        {/* Chỉ cổng Người dùng — Quản trị dùng khôi phục break-glass riêng, không qua đây. */}
        <input type="hidden" name="portal" value={defaultPortal} />

        {state.error ? (
          <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            {state.error}
          </p>
        ) : null}

        <Button type="submit" disabled={pending} className="w-full">
          {pending ? "Đang gửi…" : "Gửi yêu cầu"}
        </Button>
      </form>
      <p className="mt-4 text-center text-xs text-slate-400">
        Chúng tôi không gửi email/SMS. Quản trị viên sẽ cấp mật khẩu tạm để bạn đăng nhập và đổi lại.
      </p>
      <p className="mt-2 text-center text-sm">
        <Link href={backHref} className="text-indigo-600 hover:underline">
          ← Quay lại đăng nhập
        </Link>
      </p>
    </div>
  );
}
