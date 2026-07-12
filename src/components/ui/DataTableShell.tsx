import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

interface DataTableShellProps {
  children: ReactNode;
  className?: string;
}

/**
 * Khung bảng chuẩn hóa (10D): bọc <table> trong thẻ bo góc + cho phép cuộn ngang
 * trên mobile (thay vì vỡ layout). Header/cell spacing dùng lớp `.dt-*` ở globals.
 *
 * Cách dùng:
 *   <DataTableShell>
 *     <table className="w-full text-sm">…</table>
 *   </DataTableShell>
 */
export function DataTableShell({ children, className }: DataTableShellProps) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm",
        className,
      )}
    >
      <div className="overflow-x-auto">{children}</div>
    </div>
  );
}
