import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

interface SectionCardProps {
  /** Tiêu đề mục (tùy chọn). */
  title?: ReactNode;
  /** Mô tả ngắn dưới tiêu đề. */
  description?: ReactNode;
  /** Nút/hành động ở góc phải header (tùy chọn). */
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  /** Bỏ padding thân (dùng cho bảng/danh sách chạm mép thẻ). */
  flush?: boolean;
}

/**
 * Thẻ mục có header (tiêu đề + mô tả + hành động) và thân nội dung (10D).
 * Bản nâng cấp của Card: dùng khi cần tiêu đề rõ ràng kèm hành động ở góc.
 */
export function SectionCard({
  title,
  description,
  actions,
  children,
  className,
  flush,
}: SectionCardProps) {
  const hasHeader = Boolean(title || description || actions);
  return (
    <section
      className={cn(
        "rounded-xl border border-slate-200 bg-white shadow-sm",
        className,
      )}
    >
      {hasHeader ? (
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 px-4 py-3">
          <div className="min-w-0">
            {title ? (
              <h2 className="text-sm font-semibold text-slate-900">{title}</h2>
            ) : null}
            {description ? (
              <p className="mt-0.5 text-xs text-slate-500">{description}</p>
            ) : null}
          </div>
          {actions ? (
            <div className="flex shrink-0 items-center gap-2">{actions}</div>
          ) : null}
        </div>
      ) : null}
      <div className={cn(flush ? "" : "p-4")}>{children}</div>
    </section>
  );
}
