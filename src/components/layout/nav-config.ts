/**
 * Cấu hình điều hướng theo vai trò — bám sát UI/UX site map (spec §6).
 * Phase 1: link tới các trang shell; nội dung nghiệp vụ bổ sung ở phase sau.
 */
import type { Role } from "@/modules/auth/domain/roles";

export interface NavItem {
  label: string;
  href: string;
}

export const NAV_BY_ROLE: Record<Role, NavItem[]> = {
  ADMIN: [
    { label: "Tổng quan", href: "/admin" },
    { label: "Tài khoản Bí thư", href: "/admin/secretaries" },
    { label: "Khu phố", href: "/admin/neighborhoods" },
    { label: "Audit log", href: "/admin/audit" },
    { label: "Cấu hình", href: "/admin/settings" },
  ],
  SECRETARY: [
    { label: "Tổng quan", href: "/secretary" },
    { label: "Học sinh", href: "/secretary/students" },
    { label: "Buổi sinh hoạt", href: "/secretary/sessions" },
    { label: "Điểm danh", href: "/secretary/attendance" },
    { label: "Đơn xin nghỉ", href: "/secretary/leave-requests" },
    { label: "Thông báo", href: "/secretary/notifications" },
    { label: "Báo cáo", href: "/secretary/reports" },
  ],
  PARENT: [
    { label: "Tổng quan", href: "/parent" },
    { label: "Lịch sinh hoạt", href: "/parent/schedule" },
    { label: "Xin phép nghỉ", href: "/parent/leave-requests" },
    { label: "Thông báo", href: "/parent/notifications" },
  ],
};

export const ROLE_LABEL: Record<Role, string> = {
  ADMIN: "Quản trị viên",
  SECRETARY: "Bí thư",
  PARENT: "Phụ huynh / Học sinh",
};
