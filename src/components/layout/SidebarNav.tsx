"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils/cn";
import type { NavItem } from "./nav-config";

/**
 * Điều hướng trong shell với trạng thái active theo pathname hiện tại.
 * Mobile-first: thanh cuộn ngang trên mobile, cột dọc từ md trở lên.
 */
export function SidebarNav({
  items,
  unreadCount = 0,
}: {
  items: NavItem[];
  /** Số thông báo chưa đọc — hiện badge trên mục "Thông báo". */
  unreadCount?: number;
}) {
  const pathname = usePathname();

  return (
    <nav className="flex gap-1 overflow-x-auto px-2 pb-2 md:flex-col md:overflow-visible md:px-3 md:pb-4">
      {items.map((item) => {
        // Tổng quan (link gốc) chỉ active khi khớp chính xác; mục con active theo prefix.
        const isRoot = item.href.split("/").length <= 3;
        const active = isRoot
          ? pathname === item.href
          : pathname === item.href || pathname.startsWith(`${item.href}/`);

        // Badge chưa đọc: Parent ở mục "Thông báo"; Secretary gộp vào "Đơn & thông báo".
        const showBadge =
          (item.href.endsWith("/notifications") || item.href.endsWith("/operations")) &&
          unreadCount > 0;

        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex items-center gap-2 whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              active
                ? "bg-indigo-50 text-indigo-700"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
            )}
          >
            <span>{item.label}</span>
            {showBadge ? (
              <span
                aria-label={`${unreadCount} thông báo chưa đọc`}
                className="ml-auto inline-flex min-w-5 items-center justify-center rounded-full bg-indigo-600 px-1.5 py-0.5 text-xs font-semibold text-white"
              >
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            ) : null}
          </Link>
        );
      })}
    </nav>
  );
}
