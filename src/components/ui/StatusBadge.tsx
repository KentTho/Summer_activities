import { Badge, type BadgeTone } from "./Badge";

/**
 * StatusBadge (10D): ánh xạ các trạng thái nghiệp vụ THƯỜNG GẶP sang tone màu +
 * nhãn tiếng Việt nhất quán, để mọi cổng dùng chung một bảng màu trạng thái.
 *
 * Chỉ là lớp trình bày — không quyết định nghiệp vụ. Nếu truyền `label` thì hiển thị
 * label đó; nếu không, tra bảng theo `status` (không phân biệt hoa/thường).
 */
type StatusMeta = { tone: BadgeTone; label: string };

const STATUS_MAP: Record<string, StatusMeta> = {
  // Điểm danh
  present: { tone: "green", label: "Có mặt" },
  excused: { tone: "blue", label: "Nghỉ phép" },
  unexcused: { tone: "red", label: "Vắng KP" },
  not_marked: { tone: "slate", label: "Chưa điểm danh" },
  // Đơn nghỉ / yêu cầu
  pending: { tone: "amber", label: "Chờ xử lý" },
  approved: { tone: "green", label: "Đã duyệt" },
  rejected: { tone: "red", label: "Từ chối" },
  resolved: { tone: "green", label: "Đã xử lý" },
  // Chung
  active: { tone: "green", label: "Hoạt động" },
  inactive: { tone: "slate", label: "Ngừng" },
  canceled: { tone: "red", label: "Đã hủy" },
  closed: { tone: "slate", label: "Đã chốt" },
  open: { tone: "green", label: "Đang mở" },
  // Vai trò phân công
  primary: { tone: "indigo", label: "Phụ trách chính" },
  coordinating: { tone: "blue", label: "Phối hợp" },
};

interface StatusBadgeProps {
  status: string;
  /** Ghi đè nhãn hiển thị (giữ tone theo status). */
  label?: string;
  /** Ghi đè tone màu. */
  tone?: BadgeTone;
}

export function StatusBadge({ status, label, tone }: StatusBadgeProps) {
  const meta = STATUS_MAP[status?.toLowerCase()] ?? {
    tone: "slate" as BadgeTone,
    label: status,
  };
  return <Badge tone={tone ?? meta.tone}>{label ?? meta.label}</Badge>;
}
