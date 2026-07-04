/**
 * ============================================================================
 * DỮ LIỆU DEMO — KHÔNG PHẢI DỮ LIỆU THẬT (Prompt 03C)
 * ----------------------------------------------------------------------------
 * Tất cả tên/số điện thoại/hồ sơ dưới đây là GIẢ, dùng để minh hoạ luồng UI.
 * Không dùng dữ liệu trẻ em thật. Ngày giờ để dạng chuỗi tĩnh nhằm tránh lệch
 * SSR/hydration. Khi nối database thật (phase sau), thay lớp này bằng truy vấn
 * qua RLS — UI không phải đổi vì đã dùng chung view-model types.
 * ============================================================================
 */
import type {
  MockAttendanceRow,
  MockImportBatch,
  MockLeaveRequest,
  MockNotification,
  MockSession,
  MockStudent,
  Neighborhood,
} from "./types";

/** Bí thư demo phụ trách 2 Khu phố. */
export const NEIGHBORHOODS: Neighborhood[] = [
  { code: "KP01", name: "Khu phố 1" },
  { code: "KP02", name: "Khu phố 2" },
];

export function neighborhoodName(code: string): string {
  return NEIGHBORHOODS.find((n) => n.code === code)?.name ?? code;
}

export const STUDENTS: MockStudent[] = [
  { id: "hs-001", fullName: "Nguyễn An Bình", birthYear: 2013, neighborhoodCode: "KP01", guardianName: "Nguyễn Văn Cường", guardianPhone: "0900 000 111", active: true },
  { id: "hs-002", fullName: "Trần Gia Hân", birthYear: 2014, neighborhoodCode: "KP01", guardianName: "Trần Thị Diệu", guardianPhone: "0900 000 222", active: true },
  { id: "hs-003", fullName: "Lê Minh Khôi", birthYear: 2012, neighborhoodCode: "KP01", guardianName: "Lê Văn Em", guardianPhone: "0900 000 333", active: true },
  { id: "hs-004", fullName: "Phạm Bảo Ngọc", birthYear: 2015, neighborhoodCode: "KP02", guardianName: "Phạm Thị Hoa", guardianPhone: "0900 000 444", active: true },
  { id: "hs-005", fullName: "Võ Hoàng Long", birthYear: 2013, neighborhoodCode: "KP02", guardianName: "Võ Văn Giàu", guardianPhone: "0900 000 555", active: true },
  { id: "hs-006", fullName: "Đặng Thu Thảo", birthYear: 2014, neighborhoodCode: "KP02", guardianName: "Đặng Văn Hùng", guardianPhone: "0900 000 666", active: false },
];

export const SESSIONS: MockSession[] = [
  { id: "bs-001", title: "Sinh hoạt hè tuần 5", date: "05/07/2026", time: "07:30", type: "REGULAR", neighborhoodCodes: ["KP01"], location: "Nhà văn hoá Khu phố 1", expectedCount: 3 },
  { id: "bs-002", title: "Ngày hội đọc sách", date: "07/07/2026", time: "08:00", type: "JOINT", neighborhoodCodes: ["KP01", "KP02"], location: "Trung tâm sinh hoạt phường", expectedCount: 6 },
  { id: "bs-003", title: "Sinh hoạt hè tuần 5 (KP2)", date: "06/07/2026", time: "15:00", type: "REGULAR", neighborhoodCodes: ["KP02"], location: "Sân chơi Khu phố 2", expectedCount: 3 },
];

/** Điểm danh mẫu cho buổi bs-001 (Khu phố 1). */
export const ATTENDANCE_BS001: MockAttendanceRow[] = [
  { studentId: "hs-001", studentName: "Nguyễn An Bình", neighborhoodCode: "KP01", status: "PRESENT" },
  { studentId: "hs-002", studentName: "Trần Gia Hân", neighborhoodCode: "KP01", status: "EXCUSED" },
  { studentId: "hs-003", studentName: "Lê Minh Khôi", neighborhoodCode: "KP01", status: "UNEXCUSED" },
];

export const LEAVE_REQUESTS: MockLeaveRequest[] = [
  { id: "dn-001", studentName: "Trần Gia Hân", neighborhoodCode: "KP01", sessionTitle: "Sinh hoạt hè tuần 5", sessionDate: "05/07/2026", reason: "Về quê thăm ông bà", status: "SUBMITTED", submittedAt: "03/07/2026" },
  { id: "dn-002", studentName: "Phạm Bảo Ngọc", neighborhoodCode: "KP02", sessionTitle: "Ngày hội đọc sách", sessionDate: "07/07/2026", reason: "Đi khám sức khoẻ định kỳ", status: "SUBMITTED", submittedAt: "04/07/2026" },
  { id: "dn-003", studentName: "Lê Minh Khôi", neighborhoodCode: "KP01", sessionTitle: "Sinh hoạt hè tuần 4", sessionDate: "28/06/2026", reason: "Bị ốm", status: "ACKNOWLEDGED", submittedAt: "27/06/2026" },
  { id: "dn-004", studentName: "Võ Hoàng Long", neighborhoodCode: "KP02", sessionTitle: "Sinh hoạt hè tuần 4", sessionDate: "28/06/2026", reason: "Lý do không hợp lệ", status: "REJECTED", submittedAt: "26/06/2026" },
];

export const NOTIFICATIONS: MockNotification[] = [
  { id: "tb-001", title: "Đổi giờ buổi tuần 5", body: "Buổi sinh hoạt Khu phố 1 dời sang 07:30 sáng 05/07.", scope: "NEIGHBORHOOD", createdAt: "02/07/2026", read: false },
  { id: "tb-002", title: "Chuẩn bị Ngày hội đọc sách", body: "Các em mang theo 1 quyển sách yêu thích cho buổi chung 07/07.", scope: "SESSION", createdAt: "01/07/2026", read: false },
  { id: "tb-003", title: "Lịch nghỉ lễ", body: "Tạm nghỉ sinh hoạt ngày 02/09 theo thông báo chung.", scope: "SYSTEM", createdAt: "20/06/2026", read: true },
];

export const IMPORT_BATCHES: MockImportBatch[] = [
  { id: "im-001", fileName: "danh-sach-kp1.pdf", source: "OCR", uploadedAt: "01/07/2026", totalRows: 24, reviewedRows: 24, status: "COMMITTED" },
  { id: "im-002", fileName: "phieu-dang-ky-kp2.jpg", source: "OCR", uploadedAt: "03/07/2026", totalRows: 18, reviewedRows: 7, status: "REVIEWING" },
  { id: "im-003", fileName: "bo-sung-thang-7.xlsx", source: "MANUAL", uploadedAt: "04/07/2026", totalRows: 5, reviewedRows: 0, status: "DRAFT" },
];

/** Lịch sử điểm danh của "con" phụ huynh demo (Nguyễn An Bình). */
export const PARENT_CHILD_NAME = "Nguyễn An Bình";

/** Đơn xin nghỉ mà phụ huynh demo đã gửi cho con mình. */
export const PARENT_LEAVE_REQUESTS: MockLeaveRequest[] = [
  { id: "pdn-001", studentName: PARENT_CHILD_NAME, neighborhoodCode: "KP01", sessionTitle: "Ngày hội đọc sách", sessionDate: "07/07/2026", reason: "Có việc gia đình", status: "SUBMITTED", submittedAt: "04/07/2026" },
  { id: "pdn-002", studentName: PARENT_CHILD_NAME, neighborhoodCode: "KP01", sessionTitle: "Sinh hoạt hè tuần 3", sessionDate: "21/06/2026", reason: "Bị ốm", status: "ACKNOWLEDGED", submittedAt: "20/06/2026" },
];

export const PARENT_ATTENDANCE_HISTORY: {
  sessionTitle: string;
  date: string;
  status: MockAttendanceRow["status"];
}[] = [
  { sessionTitle: "Sinh hoạt hè tuần 5", date: "05/07/2026", status: "PRESENT" },
  { sessionTitle: "Sinh hoạt hè tuần 4", date: "28/06/2026", status: "PRESENT" },
  { sessionTitle: "Sinh hoạt hè tuần 3", date: "21/06/2026", status: "EXCUSED" },
  { sessionTitle: "Sinh hoạt hè tuần 2", date: "14/06/2026", status: "UNEXCUSED" },
];
