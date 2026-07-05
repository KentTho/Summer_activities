/**
 * Supabase browser client (Client Components).
 * Phase 1: cấu hình mẫu — chưa kết nối database thật; chỉ khởi tạo khi có env.
 */
import { createBrowserClient } from "@supabase/ssr";
import { env } from "@/lib/env";
import type { Database } from "@/lib/database.types";

export function createSupabaseBrowserClient() {
  return createBrowserClient<Database>(
    env.supabaseUrl,
    env.supabasePublishableKey,
  );
}
