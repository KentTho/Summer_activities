/**
 * Supabase ADMIN client — dùng SERVICE ROLE KEY, BỎ QUA RLS.
 *
 * ⚠️ CHỈ được import ở server-side (route handler / server action / script Node).
 * TUYỆT ĐỐI không import vào Client Component — service role key sẽ lộ ra client.
 *
 * `server-only` chưa cài trong dự án nên dùng guard runtime: ném lỗi nếu bị nạp
 * trong môi trường trình duyệt. Ngoài ra file này KHÔNG được import từ bất kỳ
 * component "use client" nào.
 */
import { createClient } from "@supabase/supabase-js";
import { env } from "@/lib/env";
import type { Database } from "@/lib/database.types";

if (typeof window !== "undefined") {
  throw new Error(
    "supabase/admin.ts bị import ở client — service role key không được phép ra client.",
  );
}

/**
 * Khởi tạo admin client. Ném lỗi rõ ràng nếu thiếu service role key để nơi gọi
 * xử lý (vd script bootstrap sẽ skip khi chưa cấu hình).
 */
export function createSupabaseAdminClient() {
  if (!env.supabaseUrl || !env.supabaseServiceRoleKey) {
    throw new Error(
      "Thiếu SUPABASE_SERVICE_ROLE_KEY / NEXT_PUBLIC_SUPABASE_URL — không thể tạo admin client.",
    );
  }

  return createClient<Database>(env.supabaseUrl, env.supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
