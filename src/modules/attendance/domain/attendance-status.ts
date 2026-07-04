/**
 * Module: attendance — Domain
 * Trạng thái điểm danh của một học sinh trong một buổi sinh hoạt.
 * Spec §3 (Luồng điểm danh) và bảng attendance_records §4.
 */

export const ATTENDANCE_STATUS = {
  /** Có mặt */
  PRESENT: "PRESENT",
  /** Nghỉ có phép (có đơn xin phép hợp lệ) */
  EXCUSED: "EXCUSED",
  /** Nghỉ không phép */
  UNEXCUSED: "UNEXCUSED",
} as const;

export type AttendanceStatus =
  (typeof ATTENDANCE_STATUS)[keyof typeof ATTENDANCE_STATUS];

export const ATTENDANCE_STATUS_LABEL: Record<AttendanceStatus, string> = {
  PRESENT: "Có mặt",
  EXCUSED: "Nghỉ có phép",
  UNEXCUSED: "Nghỉ không phép",
};
