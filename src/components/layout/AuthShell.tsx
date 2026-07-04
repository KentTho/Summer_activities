import type { ReactNode } from "react";
import Link from "next/link";

interface AuthShellProps {
  /** Nhãn cổng hiển thị trên thẻ (vd: "Cổng Quản trị", "Cổng Người dùng"). */
  portalLabel: string;
  /** Mô tả ngắn dưới nhãn cổng. */
  portalHint: string;
  children: ReactNode;
}

/**
 * Khung trang đăng nhập dùng chung cho cổng Admin và cổng Người dùng.
 * Mobile-first: thẻ căn giữa, thương hiệu gọn, có lối quay về trang chủ.
 */
export function AuthShell({ portalLabel, portalHint, children }: AuthShellProps) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center text-center">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-600 text-base font-bold text-white">
            SH
          </span>
          <p className="mt-3 text-xs font-medium uppercase tracking-wide text-indigo-600">
            {portalLabel}
          </p>
          <h1 className="mt-1 text-lg font-semibold text-slate-900">
            Điểm danh sinh hoạt hè
          </h1>
          <p className="mt-1 text-sm text-slate-500">{portalHint}</p>
        </div>

        {children}

        <p className="mt-6 text-center text-xs text-slate-400">
          <Link href="/" className="hover:text-slate-600 hover:underline">
            ← Về trang chủ
          </Link>
        </p>
      </div>
    </div>
  );
}
