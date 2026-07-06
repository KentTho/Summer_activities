/**
 * Module: sessions — Domain
 * Loại buổi sinh hoạt. Spec §2 (quy tắc session chung) và bảng activity_sessions §4.
 */

export const SESSION_TYPE = {
  /** Buổi sinh hoạt thường của một Khu phố */
  REGULAR: "REGULAR",
  /** Buổi sinh hoạt chung nhiều Khu phố (session_neighborhoods) */
  JOINT: "JOINT",
} as const;

export type SessionType = (typeof SESSION_TYPE)[keyof typeof SESSION_TYPE];

export const SESSION_TYPE_LABEL: Record<SessionType, string> = {
  REGULAR: "Buổi thường",
  JOINT: "Buổi chung nhiều Khu phố",
};

/** Tone Badge cho loại buổi (subset của BadgeTone). */
export const SESSION_TONE: Record<SessionType, "blue" | "indigo"> = {
  REGULAR: "blue",
  JOINT: "indigo",
};
