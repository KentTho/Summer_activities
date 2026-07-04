/**
 * ============================================================================
 * DỮ LIỆU DEMO ADMIN — KHÔNG PHẢI DỮ LIỆU THẬT (Prompt 03D)
 * ----------------------------------------------------------------------------
 * Góc nhìn quản trị toàn hệ thống: Khu phố, Bí thư, gán phụ trách, tổng hợp
 * học sinh/buổi, mẫu DOCX, cấu hình, audit log. Tất cả là dữ liệu GIẢ.
 * Không dùng dữ liệu trẻ em thật. Khi nối DB thật, thay lớp này bằng truy vấn
 * qua RLS (chỉ Admin) — UI giữ nguyên nhờ dùng chung view-model types.
 * ============================================================================
 */
import type {
  AdminNeighborhood,
  MockAuditLog,
  MockDocxTemplate,
  MockSecretary,
  SystemSettings,
} from "./types";

export const ADMIN_NEIGHBORHOODS: AdminNeighborhood[] = [
  { code: "KP01", name: "Khu phố 1", active: true, studentCount: 24, secretaryCount: 1 },
  { code: "KP02", name: "Khu phố 2", active: true, studentCount: 18, secretaryCount: 1 },
  { code: "KP03", name: "Khu phố 3", active: true, studentCount: 15, secretaryCount: 1 },
  { code: "KP04", name: "Khu phố 4", active: true, studentCount: 12, secretaryCount: 1 },
  { code: "KP05", name: "Khu phố 5", active: false, studentCount: 0, secretaryCount: 0 },
];

export const SECRETARIES: MockSecretary[] = [
  { id: "bt-001", fullName: "Nguyễn Thị Lan", email: "lan.nt@example.com", phone: "0901 111 001", neighborhoodCodes: ["KP01", "KP02"], active: true, createdAt: "10/06/2026" },
  { id: "bt-002", fullName: "Trần Văn Nam", email: "nam.tv@example.com", phone: "0901 111 002", neighborhoodCodes: ["KP03"], active: true, createdAt: "12/06/2026" },
  { id: "bt-003", fullName: "Lê Thị Mai", email: "mai.lt@example.com", phone: "0901 111 003", neighborhoodCodes: ["KP04"], active: true, createdAt: "15/06/2026" },
  { id: "bt-004", fullName: "Phạm Văn Hòa", email: "hoa.pv@example.com", phone: "0901 111 004", neighborhoodCodes: [], active: false, createdAt: "20/06/2026" },
];

export const DOCX_TEMPLATES: MockDocxTemplate[] = [
  { id: "tpl-001", name: "Danh sách điểm danh theo buổi", fileName: "diem-danh-buoi.docx", updatedAt: "18/06/2026", active: true },
  { id: "tpl-002", name: "Tổng hợp nghỉ theo tháng", fileName: "tong-hop-nghi-thang.docx", updatedAt: "22/06/2026", active: true },
  { id: "tpl-003", name: "Báo cáo buổi chung nhiều Khu phố", fileName: "bao-cao-buoi-chung.docx", updatedAt: "01/06/2026", active: false },
];

export const AUDIT_LOGS: MockAuditLog[] = [
  { id: "al-001", at: "04/07/2026 09:12", actorName: "Nguyễn Thị Lan", actorRole: "SECRETARY", action: "Tạo học sinh", entity: "students/hs-004", detail: "Thêm Phạm Bảo Ngọc (KP02)" },
  { id: "al-002", at: "04/07/2026 08:40", actorName: "Admin", actorRole: "ADMIN", action: "Gán Bí thư", entity: "assignments/bt-002", detail: "Trần Văn Nam ↔ Khu phố 3" },
  { id: "al-003", at: "03/07/2026 16:05", actorName: "Trần Văn Nam", actorRole: "SECRETARY", action: "Điểm danh", entity: "sessions/bs-003", detail: "Ghi nhận 15 học sinh" },
  { id: "al-004", at: "03/07/2026 10:22", actorName: "Admin", actorRole: "ADMIN", action: "Đổi cấu hình", entity: "system_settings", detail: "Cập nhật tên hệ thống" },
  { id: "al-005", at: "02/07/2026 14:31", actorName: "Admin", actorRole: "ADMIN", action: "Đổi template", entity: "export_templates/tpl-002", detail: "Cập nhật mẫu tổng hợp nghỉ" },
  { id: "al-006", at: "01/07/2026 09:00", actorName: "Admin", actorRole: "ADMIN", action: "Tạo Bí thư", entity: "secretaries/bt-004", detail: "Thêm tài khoản Phạm Văn Hòa" },
];

export const SYSTEM_SETTINGS: SystemSettings = {
  systemName: "Điểm danh sinh hoạt hè",
  logoUrl: "/logo-placeholder.png",
  primaryColor: "#4f46e5",
  footerText: "© 2026 Ban chỉ huy hè phường (demo)",
};

/* --- Aggregates cho dashboard Admin --- */
export const ADMIN_STATS = {
  neighborhoods: ADMIN_NEIGHBORHOODS.length,
  activeNeighborhoods: ADMIN_NEIGHBORHOODS.filter((n) => n.active).length,
  secretaries: SECRETARIES.length,
  activeSecretaries: SECRETARIES.filter((s) => s.active).length,
  students: ADMIN_NEIGHBORHOODS.reduce((sum, n) => sum + n.studentCount, 0),
  /** Khu phố chưa có Bí thư phụ trách. */
  unassignedNeighborhoods: ADMIN_NEIGHBORHOODS.filter((n) => n.secretaryCount === 0),
  /** Bí thư chưa được gán Khu phố nào. */
  unassignedSecretaries: SECRETARIES.filter((s) => s.neighborhoodCodes.length === 0),
};
