/**
 * Quy tắc hiển thị nút điều khiển buổi (10F) — thuần logic, dùng chung server/client.
 * UI chỉ ẩn/hiện cho hợp lý; server action + RLS vẫn là chặn cuối cùng.
 *
 * Rule:
 * - Buổi ĐÃ HỦY: chỉ cho "Khôi phục" (không Chốt/Dời/Hủy).
 * - Buổi ĐÃ CHỐT: chỉ cho "Mở lại" (không Dời/Hủy).
 * - Buổi ĐÃ QUA (ngày < hôm nay) mà còn mở: chỉ cho "Chốt" để tổng kết
 *   (không Dời/Hủy bằng nút chính — sai sót lịch sử để Admin xử lý).
 * - Buổi ĐANG MỞ và CHƯA QUA: cho Chốt, Dời, Hủy.
 * - Gửi thông báo: ẩn khi buổi đã hủy.
 */
export interface SessionFlags {
  closed: boolean;
  canceled: boolean;
  past: boolean;
}

export interface SessionActionAvailability {
  canClose: boolean;
  canReopen: boolean;
  canCancel: boolean;
  canReschedule: boolean;
  canUncancel: boolean;
  canNotifyParents: boolean;
  /** Giải thích ngắn khi các nút chỉnh sửa bị ẩn (null = không cần giải thích). */
  hiddenReason: string | null;
}

/** Ngày buổi (YYYY-MM-DD) đã qua so với hôm nay chưa (so theo ngày, không giờ). */
export function isPastSessionDate(sessionDate: string, today = new Date()): boolean {
  const todayISO = today.toISOString().slice(0, 10);
  return sessionDate < todayISO;
}

export function getSessionActionAvailability(flags: SessionFlags): SessionActionAvailability {
  const { closed, canceled, past } = flags;

  const openAndUpcoming = !closed && !canceled && !past;

  let hiddenReason: string | null = null;
  if (canceled) hiddenReason = "Buổi đã hủy — chỉ có thể khôi phục.";
  else if (closed) hiddenReason = "Buổi đã chốt — mở lại nếu cần sửa điểm danh.";
  else if (past) hiddenReason = "Buổi đã qua — chỉ nên chốt để tổng kết; đổi lịch/hủy hãy liên hệ Quản trị.";

  return {
    canClose: !closed && !canceled,
    canReopen: closed && !canceled,
    canCancel: openAndUpcoming,
    canReschedule: openAndUpcoming,
    canUncancel: canceled,
    canNotifyParents: !canceled,
    hiddenReason,
  };
}
