import { hasSupabaseEnv } from "@/lib/env";

/**
 * Health check cơ bản — dùng cho CI/smoke test và giám sát.
 * KHÔNG trả về giá trị secret, chỉ báo đã cấu hình env hay chưa.
 */
export async function GET() {
  return Response.json({
    status: "ok",
    phase: "5-db-schema-rls",
    supabaseConfigured: hasSupabaseEnv(),
    time: new Date().toISOString(),
  });
}
