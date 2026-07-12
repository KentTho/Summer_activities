import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

interface ActionBarProps {
  /** Nội dung bên trái (thường là ô tìm kiếm / bộ lọc / mô tả số lượng). */
  children?: ReactNode;
  /** Hành động bên phải (nút chính, xuất báo cáo…). */
  actions?: ReactNode;
  className?: string;
}

/**
 * Thanh hành động/bộ lọc trên đầu bảng hoặc danh sách (10D).
 * Trái = filter/mô tả, phải = hành động chính; tự xuống dòng gọn trên mobile.
 */
export function ActionBar({ children, actions, className }: ActionBarProps) {
  return (
    <div
      className={cn(
        "mb-3 flex flex-wrap items-center gap-2",
        Boolean(actions) && "justify-between",
        className,
      )}
    >
      {children ? (
        <div className="flex flex-1 flex-wrap items-center gap-2">{children}</div>
      ) : null}
      {actions ? (
        <div className="flex shrink-0 items-center gap-2">{actions}</div>
      ) : null}
    </div>
  );
}
