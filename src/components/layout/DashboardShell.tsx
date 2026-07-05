import type { ReactNode } from "react";
import { ROLES, type Role } from "@/modules/auth/domain/roles";
import { signOut } from "@/lib/auth/actions";
import { DemoNotice } from "@/components/ui";
import { NAV_BY_ROLE, ROLE_LABEL } from "./nav-config";
import { SidebarNav } from "./SidebarNav";

interface DashboardShellProps {
  role: Role;
  /** Tên hiển thị người đăng nhập (từ profiles.full_name). */
  fullName?: string;
  children: ReactNode;
}

/**
 * Khung dashboard dùng chung cho các vai trò. Mobile-first:
 * - Top bar dính trên cùng: thương hiệu, nhãn vai trò, lối "Đăng xuất".
 * - Điều hướng: thanh cuộn ngang trên mobile, cột dọc (sidebar) từ md trở lên.
 */
export function DashboardShell({
  role,
  fullName,
  children,
}: DashboardShellProps) {
  const nav = NAV_BY_ROLE[role];
  const portal = role === ROLES.ADMIN ? "admin" : "user";

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
        <div className="flex items-center gap-2">
          {fullName ? (
            <span className="hidden text-sm text-slate-600 sm:inline">
              {fullName}
            </span>
          ) : null}
          <form action={signOut.bind(null, portal)}>
            <button
              type="submit"
              className="rounded-lg px-3 py-2 text-sm font-medium text-slate-500 hover:bg-slate-100 hover:text-slate-800"
            >
              Đăng xuất
            </button>
          </form>
        </div>
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
