import { hasGeminiConfigured, hasSupabaseEnv, isAiImportReady } from "@/lib/env";

/**
 * Health check cơ bản — dùng cho CI/smoke test và giám sát.
 * KHÔNG trả về giá trị secret; chỉ báo các cấu hình/tính năng đã sẵn sàng (boolean).
 */
export async function GET() {
  return Response.json({
    status: "ok",
    phase: "09e-password-requests-real-smoke",
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
    docxExportReady: true,
    passwordChangeReady: true,
    time: new Date().toISOString(),
  });
}
