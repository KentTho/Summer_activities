/**
 * Ánh xạ trạng thái → tone Badge + nhãn cho import (UI concern, tách khỏi domain).
 * Nhãn trạng thái domain (điểm danh/đơn nghỉ/loại buổi) lấy trực tiếp từ module.
 */
import type { BadgeTone } from "@/components/ui";
import type { AttendanceStatus } from "@/modules/attendance/domain/attendance-status";
import type { SessionType } from "@/modules/sessions/domain/session-type";
import type { LeaveStatus } from "@/modules/leave-requests/domain/leave-status";
import type { ImportStatus } from "./types";

export const ATTENDANCE_TONE: Record<AttendanceStatus, BadgeTone> = {
  PRESENT: "green",
  EXCUSED: "amber",
  UNEXCUSED: "red",
};

export const LEAVE_TONE: Record<LeaveStatus, BadgeTone> = {
  SUBMITTED: "blue",
  ACKNOWLEDGED: "green",
  REJECTED: "red",
};

export const SESSION_TONE: Record<SessionType, BadgeTone> = {
  REGULAR: "slate",
  JOINT: "indigo",
};

export const IMPORT_STATUS_LABEL: Record<ImportStatus, string> = {
  DRAFT: "Nháp",
  REVIEWING: "Đang duyệt",
  COMMITTED: "Đã ghi nhận",
  REJECTED: "Từ chối",
};

export const IMPORT_STATUS_TONE: Record<ImportStatus, BadgeTone> = {
  DRAFT: "slate",
  REVIEWING: "amber",
  COMMITTED: "green",
  REJECTED: "red",
};
