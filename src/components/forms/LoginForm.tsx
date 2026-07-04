import type { ReactNode } from "react";
import { Button } from "@/components/ui";

interface LoginFormProps {
  /** Nhãn trường tài khoản (Admin: email; Người dùng: email/SĐT/mã tài khoản). */
  accountLabel: string;
  accountPlaceholder: string;
  submitLabel: string;
  /** Ghi chú dưới form (giải thích trạng thái shell / chiến lược đăng nhập). */
  footer?: ReactNode;
}

/**
 * Form đăng nhập dạng shell (Phase 03B) — CHƯA gọi Supabase Auth.
 * Field bị disabled để nhấn mạnh đây là khung; xác thực thật + rate limit ở phase sau (spec §7).
 */
export function LoginForm({
  accountLabel,
  accountPlaceholder,
  submitLabel,
  footer,
}: LoginFormProps) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <form className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            {accountLabel}
          </label>
          <input
            type="text"
            disabled
            placeholder={accountPlaceholder}
            className="h-11 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none disabled:bg-slate-50"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            Mật khẩu
          </label>
          <input
            type="password"
            disabled
            placeholder="••••••••"
            className="h-11 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none disabled:bg-slate-50"
          />
        </div>
        <Button type="button" disabled className="w-full">
          {submitLabel}
        </Button>
      </form>
      {footer ? <div className="mt-4 text-xs text-slate-400">{footer}</div> : null}
    </div>
  );
}
