"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils/cn";
import type { NavItem } from "./nav-config";

/**
 * Điều hướng trong shell với trạng thái active theo pathname hiện tại.
 * Mobile-first: thanh cuộn ngang trên mobile, cột dọc từ md trở lên.
 */
export function SidebarNav({ items }: { items: NavItem[] }) {
  const pathname = usePathname();

  return (
    <nav className="flex gap-1 overflow-x-auto px-2 pb-2 md:flex-col md:overflow-visible md:px-3 md:pb-4">
      {items.map((item) => {
        // Tổng quan (link gốc) chỉ active khi khớp chính xác; mục con active theo prefix.
        const isRoot = item.href.split("/").length <= 3;
        const active = isRoot
          ? pathname === item.href
          : pathname === item.href || pathname.startsWith(`${item.href}/`);

        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              active
                ? "bg-indigo-50 text-indigo-700"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
