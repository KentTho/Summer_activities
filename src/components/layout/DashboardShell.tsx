import type { ReactNode } from "react";
import Link from "next/link";
import type { Role } from "@/modules/auth/domain/roles";
import { DemoNotice } from "@/components/ui";
import { NAV_BY_ROLE, ROLE_LABEL, ROLE_LOGIN_HREF } from "./nav-config";
import { SidebarNav } from "./SidebarNav";

interface DashboardShellProps {
  role: Role;
  children: ReactNode;
}

/**
 * Khung dashboard dùng chung cho các vai trò. Mobile-first:
 * - Top bar dính trên cùng: thương hiệu, nhãn vai trò, lối "Đăng xuất".
 * - Điều hướng: thanh cuộn ngang trên mobile, cột dọc (sidebar) từ md trở lên.
 */
export function DashboardShell({ role, children }: DashboardShellProps) {
  const nav = NAV_BY_ROLE[role];

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 text-slate-800">
      <header className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white/90 px-4 py-3 backdrop-blur md:px-6">
        <div className="flex items-center gap-3">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-sm font-bold text-white">
            SH
          </span>
          <div className="leading-tight">
            <p className="text-sm font-semibold text-slate-900">Sinh hoạt hè</p>
            <p className="text-xs text-slate-500">{ROLE_LABEL[role]}</p>
          </div>
        </div>
        <Link
          href={ROLE_LOGIN_HREF[role]}
          className="rounded-lg px-3 py-2 text-sm font-medium text-slate-500 hover:bg-slate-100 hover:text-slate-800"
        >
          Đăng xuất
        </Link>
      </header>

      <div className="flex flex-1 flex-col md:flex-row">
        <aside className="border-b border-slate-200 bg-white md:w-60 md:border-b-0 md:border-r">
          <SidebarNav items={nav} />
        </aside>
        <main className="flex-1 px-4 py-6 md:px-8">
          <div className="mx-auto w-full max-w-5xl">
            <DemoNotice className="mb-5" />
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
