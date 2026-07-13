import { hasGeminiConfigured, hasServiceRoleKey, hasSupabaseEnv, isAiImportReady } from "@/lib/env";

/**
 * Health check cơ bản — dùng cho CI/smoke test và giám sát.
 * KHÔNG trả về giá trị secret; chỉ báo các cấu hình/tính năng đã sẵn sàng (boolean).
 */
export async function GET() {
  return Response.json({
    status: "ok",
    phase: "10f-user-portal-flow-redesign",
    supabaseConfigured: hasSupabaseEnv(),
    databaseTypesReady: true,
    geminiConfigured: hasGeminiConfigured(),
    aiImportReady: isAiImportReady(),
    aiImportRateLimitReady: true,
    aiImportStorageReady: true,
    // 09D — route xem/tải ảnh gốc AI import (có xác thực + audit).
    aiImportImageViewerReady: true,
    // 09D — script dọn ảnh AI import cũ (dry-run mặc định, cần --apply mới xóa).
    aiImportRetentionReady: true,
    // 09D — script check production health + docs uptime.
    monitoringReady: true,
    // 09E — luồng quên mật khẩu → Admin cấp lại mật khẩu tạm.
    passwordResetRequestReady: true,
    // 09E — script cấp phát tài khoản Bí thư (đọc env, must_change_password).
    secretaryProvisioningReady: true,
    // 09E — đã smoke route ảnh bằng session thật (Admin/Bí thư/PARENT).
    realSessionImageSmokeReady: true,
    // 09F — script khôi phục Admin gốc (break-glass, service role, không hardcode mật khẩu).
    adminRecoveryReady: true,
    // 09F — đã smoke logic đăng nhập Admin + ép đổi mật khẩu (session thật, tài khoản disposable).
    adminLoginSmokeReady: true,
    // 09F — đã smoke phân quyền route ảnh theo 4 vai trò (session thật, fixtures SMOKE_09F).
    aiImageRoleSmokeReady: true,
    // 09G — E2E đăng nhập Admin qua JWT/session thật (tài khoản disposable SMOKE_09G).
    adminUiE2eReady: true,
    // 09G — E2E quên mật khẩu: tạo yêu cầu → Admin thấy PENDING → resolve → RESOLVED (audit không PII).
    passwordRequestE2eReady: true,
    // 09G — smoke route ảnh qua HTTP + cookie thật (status/header/audit theo từng vai trò).
    aiImageHttpSmokeReady: true,
    // 09G — công cụ gán Khu phố cho Bí thư (dry-run mặc định, chỉ ghi khi có chỉ định + APPLY).
    secretaryAssignmentReady: true,
    // 09H — server hiện tại có SERVICE ROLE KEY? (route storage cần; production phải set trên Vercel).
    serviceRoleConfigured: hasServiceRoleKey(),
    // 09H — thông báo tự động khi hủy/dời buổi + Admin gửi hệ thống + unread/mark-read.
    notificationCoreReady: true,
    // 09H — workflow retention ảnh AI (dry-run mặc định, apply chỉ khi bật repo variable).
    retentionWorkflowReady: true,
    // 09H — workflow CI chạy smoke E2E với Repository Secrets (fail-fast khi thiếu).
    ciSmokeReady: true,
    // 10B — Trung tâm thông tin cá nhân (Admin/Bí thư/Phụ huynh) + tự cập nhật an toàn qua RPC.
    profileCenterReady: true,
    // 10B — AI import mở rộng field: năm sinh/giới tính/chữ ký (không suy đoán, thiếu để trống).
    aiImportExtendedFieldsReady: true,
    // 10B — đã rà soát logic sản phẩm User/Admin (docs/product-logic-audit-10B.md).
    productLogicAuditReady: true,
    // 10B — đã rà soát độ mượt runtime Vercel (docs/vercel-runtime-smoothness-audit.md).
    vercelSmoothnessAuditReady: true,
    // 10C — public/User không quảng bá link Admin; Admin vào riêng qua /admin.
    portalSeparationReady: true,
    // 10C — bảng/form học sinh hiển thị & sửa năm sinh/giới tính/chữ ký (Bí thư sửa, Admin xem).
    studentExtendedFieldsReady: true,
    // 10C — đã áp/push các patch Codex review 10B (zod length, batch bind, RPC execute restrict).
    codex10bPatchApplied: true,
    // 10C — PROJECT_PROGRESS cập nhật đầy đủ + kế hoạch 10D/10E/10F.
    progressPlanUpdated: true,
    // 10D — design system light + polish giao diện toàn dự án (không đổi nghiệp vụ).
    uiPolishReady: true,
    // 10D — cổng Admin đã polish (dashboard/bảng/form/trạng thái nhất quán).
    adminUiPolishReady: true,
    // 10D — cổng Người dùng (Bí thư + Phụ huynh) đã polish.
    userUiPolishReady: true,
    // 10D — rà soát responsive/accessibility (focus rõ, bảng cuộn, label form).
    responsivePassReady: true,
    docxExportReady: true,
    passwordChangeReady: true,
    // 10E — tối ưu tương tác: toast feedback + optimistic + layout desktop + redirect.
    interactionOptimizationReady: true,
    // 10E — điểm danh optimistic (click phản hồi ngay, rollback khi lỗi, không reload trang).
    attendanceOptimisticReady: true,
    // 10E — đã có phiên vào trang login → redirect thẳng đúng portal theo vai trò.
    loginRedirectReady: true,
    // 10E — đã rà soát workflow Admin/User (docs/workflow-logic-audit-10E.md).
    workflowAuditReady: true,
    // 10F — User portal refactor luồng (nav gộp, layout, feedback) (docs/user-portal-flow-redesign-10F.md).
    userPortalFlowReady: true,
    // 10F — chi tiết buổi layout 2 cột rộng + roster cuộn + rail điều khiển sticky.
    sessionLayoutRedesigned: true,
    // 10F — gộp điều hướng: bỏ "Điểm danh" trùng; "Đơn & thông báo" gộp vào /operations.
    navConsolidated: true,
    // 10F — trang Vận hành (đơn xin nghỉ + gửi thông báo phụ huynh) 2 tab.
    operationsPageReady: true,
    // 10F — buổi chung nhiều Khu phố: selector Khu phố + bộ đếm theo Khu phố/tổng (RLS giữ nguyên).
    jointSessionAttendanceReady: true,
    time: new Date().toISOString(),
  });
}
