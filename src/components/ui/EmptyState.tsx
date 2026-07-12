import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

interface EmptyStateProps {
  /** Biểu tượng/emoji minh họa (tùy chọn). */
  icon?: ReactNode;
  title: string;
  /** Mô tả ngắn giải thích vì sao trống / gợi ý hành động tiếp theo. */
  description?: ReactNode;
  /** Nút hành động (tùy chọn). */
  action?: ReactNode;
  className?: string;
}

/**
 * Trạng thái rỗng chuẩn hóa (10D): dùng khi danh sách/bảng không có dữ liệu.
 * Thay cho các dòng "Không có… " rời rạc để mọi trang trông nhất quán.
 */
export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-2 px-4 py-10 text-center",
        className,
      )}
    >
      {icon ? (
        <div className="text-2xl text-slate-300" aria-hidden>
          {icon}
        </div>
      ) : null}
      <p className="text-sm font-medium text-slate-700">{title}</p>
      {description ? (
        <p className="max-w-sm text-xs text-slate-500">{description}</p>
      ) : null}
      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  );
}
