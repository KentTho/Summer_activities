/**
 * Supabase browser client (Client Components).
 * Phase 1: cấu hình mẫu — chưa kết nối database thật; chỉ khởi tạo khi có env.
 */
import { createBrowserClient } from "@supabase/ssr";
import { env } from "@/lib/env";

export function createSupabaseBrowserClient() {
  return createBrowserClient(env.supabaseUrl, env.supabasePublishableKey);
}
