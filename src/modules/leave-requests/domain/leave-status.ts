/**
 * Module: leave-requests — Domain
 * Trạng thái đơn xin phép nghỉ. Spec §3 (Luồng phụ huynh xin phép nghỉ)
 * và bảng leave_requests §4.
 */

export const LEAVE_STATUS = {
  /** Phụ huynh đã gửi, chờ Bí thư xử lý */
  SUBMITTED: "SUBMITTED",
  /** Bí thư đã ghi nhận là nghỉ có phép */
  ACKNOWLEDGED: "ACKNOWLEDGED",
  /** Bị từ chối / không hợp lệ */
  REJECTED: "REJECTED",
} as const;

export type LeaveStatus = (typeof LEAVE_STATUS)[keyof typeof LEAVE_STATUS];

export const LEAVE_STATUS_LABEL: Record<LeaveStatus, string> = {
  SUBMITTED: "Chờ xử lý",
  ACKNOWLEDGED: "Đã ghi nhận",
  REJECTED: "Từ chối",
};
