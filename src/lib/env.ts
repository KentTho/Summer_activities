/**
 * Truy cập biến môi trường tập trung — KHÔNG hardcode secret.
 * Tất cả giá trị đọc từ process.env (xem .env.example).
 *
 * Phase 1: chỉ đọc + kiểm tra tồn tại "mềm" để scaffold chạy được khi chưa
 * cấu hình Supabase. Từ Phase 2 trở đi, dùng assertSupabaseEnv() ở nơi bắt buộc
 * phải có kết nối thật.
 */

export const env = {
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
  // Chỉ dùng ở server-side (route handler / server action). Không bao giờ expose ra client.
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY ?? "",
  appBaseUrl: process.env.APP_BASE_URL ?? "http://localhost:3000",
} as const;

/** true khi đã cấu hình đủ Supabase public env để khởi tạo client. */
export function hasSupabaseEnv(): boolean {
  return Boolean(env.supabaseUrl && env.supabaseAnonKey);
}

/** Ném lỗi rõ ràng khi thiếu env ở nơi bắt buộc phải có kết nối Supabase. */
export function assertSupabaseEnv(): void {
  if (!hasSupabaseEnv()) {
    throw new Error(
      "Thiếu NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY. " +
        "Sao chép .env.example thành .env.local và điền giá trị.",
    );
  }
}
