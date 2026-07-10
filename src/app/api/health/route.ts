import { hasGeminiConfigured, hasSupabaseEnv, isAiImportReady } from "@/lib/env";

/**
 * Health check cơ bản — dùng cho CI/smoke test và giám sát.
 * KHÔNG trả về giá trị secret; chỉ báo các cấu hình/tính năng đã sẵn sàng (boolean).
 */
export async function GET() {
  return Response.json({
    status: "ok",
    phase: "09g-e2e-image-admin-assignment",
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
    docxExportReady: true,
    passwordChangeReady: true,
    time: new Date().toISOString(),
  });
}
