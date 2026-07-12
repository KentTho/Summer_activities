import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

export type AlertTone = "success" | "error" | "warning" | "info";

const TONES: Record<AlertTone, { box: string; icon: string }> = {
  success: { box: "border-emerald-200 bg-emerald-50 text-emerald-800", icon: "✓" },
  error: { box: "border-rose-200 bg-rose-50 text-rose-800", icon: "!" },
  warning: { box: "border-amber-200 bg-amber-50 text-amber-800", icon: "⚠" },
  info: { box: "border-sky-200 bg-sky-50 text-sky-800", icon: "i" },
};

interface InlineAlertProps {
  tone?: AlertTone;
  /** Tiêu đề đậm (tùy chọn). */
  title?: ReactNode;
  children?: ReactNode;
  className?: string;
}

/**
 * Thông báo trong-trang chuẩn hóa (10D): thành công / lỗi / cảnh báo / thông tin.
 * Có role phù hợp để trình đọc màn hình đọc đúng (alert cho lỗi/cảnh báo, status cho còn lại).
 */
export function InlineAlert({
  tone = "info",
  title,
  children,
  className,
}: InlineAlertProps) {
  const t = TONES[tone];
  const role = tone === "error" || tone === "warning" ? "alert" : "status";
  return (
    <div
      role={role}
      className={cn(
        "flex items-start gap-2 rounded-lg border px-3 py-2 text-sm",
        t.box,
        className,
      )}
    >
      <span aria-hidden className="mt-0.5 select-none font-bold">
        {t.icon}
      </span>
      <div className="min-w-0">
        {title ? <p className="font-semibold">{title}</p> : null}
        {children ? <div className={cn(Boolean(title) && "mt-0.5")}>{children}</div> : null}
      </div>
    </div>
  );
}
