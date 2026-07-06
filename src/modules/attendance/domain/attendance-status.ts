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

/** Tone Badge cho từng trạng thái (subset của BadgeTone). */
export const ATTENDANCE_TONE: Record<AttendanceStatus, "green" | "amber" | "red"> = {
  PRESENT: "green",
  EXCUSED: "amber",
  UNEXCUSED: "red",
};

/**
 * Giá trị "chưa điểm danh" ở tầng UI. KHÔNG lưu vào DB — biểu diễn bằng việc
 * KHÔNG có bản ghi attendance_records (hoặc xóa bản ghi hiện có).
 */
export const NOT_MARKED = "NOT_MARKED" as const;
export type MarkValue = AttendanceStatus | typeof NOT_MARKED;

/** Các lựa chọn điểm danh hiển thị trên UI (theo yêu cầu: 4 trạng thái). */
export const MARK_OPTIONS: { value: MarkValue; label: string }[] = [
  { value: "PRESENT", label: "Có mặt" },
  { value: "EXCUSED", label: "Có phép" },
  { value: "UNEXCUSED", label: "Không phép" },
  { value: NOT_MARKED, label: "Bỏ trống" },
];
