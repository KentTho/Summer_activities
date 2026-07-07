/**
 * Supabase browser client (Client Components).
 * Phase 1: cấu hình mẫu — chưa kết nối database thật; chỉ khởi tạo khi có env.
 */
import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/lib/database.types";

export function createSupabaseBrowserClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const supabasePublishableKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    "";

  return createBrowserClient<Database>(
    supabaseUrl,
    supabasePublishableKey,
  );
}
