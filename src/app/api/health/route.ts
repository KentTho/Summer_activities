import { hasOcrConfigured, hasSupabaseEnv } from "@/lib/env";

/**
 * Health check cơ bản — dùng cho CI/smoke test và giám sát.
 * KHÔNG trả về giá trị secret; chỉ báo các cấu hình/tính năng đã sẵn sàng (boolean).
 */
export async function GET() {
  return Response.json({
    status: "ok",
    phase: "09a-production-hardening",
    supabaseConfigured: hasSupabaseEnv(),
    databaseTypesReady: true,
    ocrConfigured: hasOcrConfigured(),
    docxExportReady: true,
    passwordChangeReady: true,
    time: new Date().toISOString(),
  });
}
