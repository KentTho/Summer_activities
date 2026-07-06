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
    { label: "Bí thư / Chi Đoàn", href: "/admin/secretaries" },
    { label: "Phụ huynh / HS", href: "/admin/parents" },
    { label: "Khu phố", href: "/admin/neighborhoods" },
    { label: "Gán phụ trách", href: "/admin/assignments" },
    { label: "Học sinh", href: "/admin/students" },
    { label: "Buổi sinh hoạt", href: "/admin/sessions" },
    { label: "Mẫu báo cáo", href: "/admin/templates" },
    { label: "Báo cáo", href: "/admin/reports" },
    { label: "Audit log", href: "/admin/audit" },
    { label: "Cấu hình", href: "/admin/settings" },
  ],
  SECRETARY: [
    { label: "Tổng quan", href: "/user/secretary" },
    { label: "Học sinh", href: "/user/secretary/students" },
    { label: "Buổi sinh hoạt", href: "/user/secretary/sessions" },
    { label: "Điểm danh", href: "/user/secretary/attendance" },
    { label: "Đơn xin nghỉ", href: "/user/secretary/leave-requests" },
    { label: "Nhập giấy tờ", href: "/user/secretary/import" },
    { label: "Thông báo", href: "/user/secretary/notifications" },
    { label: "Báo cáo", href: "/user/secretary/reports" },
  ],
  PARENT: [
    { label: "Tổng quan", href: "/user/parent" },
    { label: "Lịch sinh hoạt", href: "/user/parent/schedule" },
    { label: "Lịch sử điểm danh", href: "/user/parent/attendance" },
    { label: "Xin phép nghỉ", href: "/user/parent/leave-requests" },
    { label: "Thông báo", href: "/user/parent/notifications" },
  ],
};

export const ROLE_LABEL: Record<Role, string> = {
  ADMIN: "Quản trị viên",
  SECRETARY: "Bí thư",
  PARENT: "Phụ huynh / Học sinh",
};

/**
 * Cổng đăng nhập tương ứng mỗi vai trò — dùng cho nút "Đăng xuất" trong shell.
 * Admin và Người dùng tách cổng riêng (spec §UI, Prompt 03B).
 */
export const ROLE_LOGIN_HREF: Record<Role, string> = {
  ADMIN: "/admin/login",
  SECRETARY: "/user/login",
  PARENT: "/user/login",
};
