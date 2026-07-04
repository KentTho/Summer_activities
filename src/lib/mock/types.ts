/**
 * View-model types cho DỮ LIỆU DEMO (Prompt 03C).
 * Đây KHÔNG phải schema database — chỉ mô tả hình dạng mock hiển thị trên UI.
 * Bám sát domain enum (attendance/session/leave/notification) để dễ thay bằng
 * dữ liệu thật ở phase sau.
 */
import type { AttendanceStatus } from "@/modules/attendance/domain/attendance-status";
import type { SessionType } from "@/modules/sessions/domain/session-type";
import type { LeaveStatus } from "@/modules/leave-requests/domain/leave-status";
import type { NotificationScope } from "@/modules/notifications/domain/scope-type";
import type { Role } from "@/modules/auth/domain/roles";

export interface Neighborhood {
  code: string;
  name: string;
}

export interface MockStudent {
  id: string;
  fullName: string;
  birthYear: number;
  neighborhoodCode: string;
  guardianName: string;
  guardianPhone: string;
  active: boolean;
}

export interface MockSession {
  id: string;
  title: string;
  /** Ngày hiển thị dạng dd/mm/yyyy (chuỗi tĩnh — tránh lệch SSR/hydration). */
  date: string;
  time: string;
  type: SessionType;
  neighborhoodCodes: string[];
  location: string;
  expectedCount: number;
}

export interface MockAttendanceRow {
  studentId: string;
  studentName: string;
  neighborhoodCode: string;
  status: AttendanceStatus;
}

export interface MockLeaveRequest {
  id: string;
  studentName: string;
  neighborhoodCode: string;
  sessionTitle: string;
  sessionDate: string;
  reason: string;
  status: LeaveStatus;
  submittedAt: string;
}

export interface MockNotification {
  id: string;
  title: string;
  body: string;
  scope: NotificationScope;
  createdAt: string;
  read: boolean;
}

export type ImportSource = "OCR" | "MANUAL";
export type ImportStatus = "DRAFT" | "REVIEWING" | "COMMITTED" | "REJECTED";

export interface MockImportBatch {
  id: string;
  fileName: string;
  source: ImportSource;
  uploadedAt: string;
  totalRows: number;
  reviewedRows: number;
  status: ImportStatus;
}

/* ------------------------------------------------------------------ *
 * Admin view-models (Prompt 03D) — tổng quan toàn hệ thống.
 * ------------------------------------------------------------------ */

/** Khu phố ở góc nhìn Admin: kèm số liệu tổng hợp. */
export interface AdminNeighborhood {
  code: string;
  name: string;
  active: boolean;
  studentCount: number;
  secretaryCount: number;
}

export interface MockSecretary {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  /** Mã Khu phố được gán phụ trách (rỗng = chưa gán). */
  neighborhoodCodes: string[];
  active: boolean;
  createdAt: string;
}

export interface MockAuditLog {
  id: string;
  /** "dd/mm/yyyy HH:MM" — chuỗi tĩnh, tránh lệch SSR. */
  at: string;
  actorName: string;
  actorRole: Role;
  action: string;
  entity: string;
  detail: string;
}

export interface MockDocxTemplate {
  id: string;
  name: string;
  fileName: string;
  updatedAt: string;
  active: boolean;
}

/** Cấu hình hệ thống an toàn — chỉ field whitelist (spec §7). */
export interface SystemSettings {
  systemName: string;
  logoUrl: string;
  primaryColor: string;
  footerText: string;
}
