import { hasGeminiConfigured, hasSupabaseEnv, isAiImportReady } from "@/lib/env";

/**
 * Health check cơ bản — dùng cho CI/smoke test và giám sát.
 * KHÔNG trả về giá trị secret; chỉ báo các cấu hình/tính năng đã sẵn sàng (boolean).
 */
export async function GET() {
  return Response.json({
    status: "ok",
    phase: "09d-ai-import-evidence-monitoring",
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
    docxExportReady: true,
    passwordChangeReady: true,
    time: new Date().toISOString(),
  });
}
