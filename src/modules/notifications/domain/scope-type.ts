/**
 * Module: notifications — Domain
 * Phạm vi phát thông báo. Spec §3 (Luồng thông báo) và bảng notifications §4.
 */

export const NOTIFICATION_SCOPE = {
  /** Phát theo Khu phố */
  NEIGHBORHOOD: "NEIGHBORHOOD",
  /** Phát theo buổi sinh hoạt cụ thể */
  SESSION: "SESSION",
  /** Toàn hệ thống (chỉ Admin) */
  SYSTEM: "SYSTEM",
} as const;

export type NotificationScope =
  (typeof NOTIFICATION_SCOPE)[keyof typeof NOTIFICATION_SCOPE];

export const NOTIFICATION_SCOPE_LABEL: Record<NotificationScope, string> = {
  NEIGHBORHOOD: "Theo Khu phố",
  SESSION: "Theo buổi sinh hoạt",
  SYSTEM: "Toàn hệ thống",
};
