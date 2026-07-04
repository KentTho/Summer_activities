import type { ReactNode } from "react";
import Link from "next/link";
import type { Role } from "@/modules/auth/domain/roles";
import { NAV_BY_ROLE, ROLE_LABEL } from "./nav-config";

interface DashboardShellProps {
  role: Role;
  children: ReactNode;
}

/**
 * Khung dashboard dùng chung cho 3 vai trò. Mobile-first:
 * - Điều hướng là thanh cuộn ngang trên mobile, cột dọc từ md trở lên.
 */
export function DashboardShell({ role, children }: DashboardShellProps) {
  const nav = NAV_BY_ROLE[role];

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 text-slate-800 md:flex-row">
      <aside className="border-b border-slate-200 bg-white md:w-64 md:border-b-0 md:border-r">
        <div className="px-4 py-4">
          <p className="text-xs uppercase tracking-wide text-slate-400">
            Sinh hoạt hè
          </p>
          <p className="text-sm font-semibold text-slate-700">
            {ROLE_LABEL[role]}
          </p>
        </div>
        <nav className="flex gap-1 overflow-x-auto px-2 pb-2 md:flex-col md:overflow-visible md:pb-4">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="whitespace-nowrap rounded-lg px-3 py-2 text-sm text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>
      <main className="flex-1 px-4 py-6 md:px-8">{children}</main>
    </div>
  );
}
