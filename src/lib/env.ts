/**
 * Truy cập biến môi trường tập trung — KHÔNG hardcode secret.
 * Tất cả giá trị đọc từ process.env (xem .env.example).
 *
 * Phase 1: chỉ đọc + kiểm tra tồn tại "mềm" để scaffold chạy được khi chưa
 * cấu hình Supabase. Từ Phase 2 trở đi, dùng assertSupabaseEnv() ở nơi bắt buộc
 * phải có kết nối thật.
 */
import "server-only";

export const env = {
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
  // Khóa public mới của Supabase (publishable). Giữ backward-compat với tên cũ
  // `NEXT_PUBLIC_SUPABASE_ANON_KEY` để code/CI cũ vẫn chạy được.
  supabasePublishableKey:
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    "",
  // Chỉ dùng ở server-side (route handler / server action). Không bao giờ expose ra client.
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY ?? "",
  appBaseUrl: process.env.APP_BASE_URL ?? "http://localhost:3000",
  // --- AI import (Gemini Vision, server-only). Key TUYỆT ĐỐI không expose ra client. ---
  geminiApiKey: process.env.GEMINI_API_KEY ?? "",
  geminiModel: process.env.GEMINI_MODEL ?? "gemini-2.5-flash",
  geminiApiBaseUrl: (process.env.GEMINI_API_BASE_URL ?? "https://generativelanguage.googleapis.com").replace(/\/+$/, ""),
  // Giới hạn kích thước ảnh gửi lên AI (MB) — chống DoS/parse tốn tài nguyên.
  aiImportMaxFileMb: Number(process.env.AI_IMPORT_MAX_FILE_MB ?? "4") || 4,
  // Cho phép tắt AI import qua env (mặc định bật). "false" ⇒ tắt (nhập tay vẫn chạy).
  aiImportEnabled: (process.env.AI_IMPORT_ENABLED ?? "true").toLowerCase() !== "false",
  // Giới hạn số lượt gọi AI/người dùng/ngày để bảo vệ quota Gemini.
  aiImportDailyLimit: Math.max(1, Number(process.env.AI_IMPORT_DAILY_LIMIT ?? "50") || 50),
} as const;

/** true khi đã cấu hình đủ Supabase public env để khởi tạo client. */
export function hasSupabaseEnv(): boolean {
  return Boolean(env.supabaseUrl && env.supabasePublishableKey);
}

/**
 * true khi có service role key (server-only). Dùng để bật/tắt các thao tác admin
 * (vd bootstrap demo users). KHÔNG bao giờ gọi hàm này ở client component.
 */
export function hasServiceRoleKey(): boolean {
  return Boolean(env.supabaseUrl && env.supabaseServiceRoleKey);
}

/**
 * true khi đã cấu hình đủ Gemini để gọi API thật (server-only).
 * Thiếu key → UI/flow import vẫn chạy nhưng KHÔNG gọi AI; nhập tay bình thường.
 * KHÔNG bao giờ gọi hàm này (hoặc đọc key) ở client component.
 */
export function hasGeminiConfigured(): boolean {
  return Boolean(env.geminiApiKey);
}

/** true khi tính năng AI import được bật (env) VÀ đã có key. */
export function isAiImportReady(): boolean {
  return env.aiImportEnabled && hasGeminiConfigured();
}

/** Ném lỗi rõ ràng khi thiếu env ở nơi bắt buộc phải có kết nối Supabase. */
export function assertSupabaseEnv(): void {
  if (!hasSupabaseEnv()) {
    throw new Error(
      "Thiếu NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY " +
        "(hoặc NEXT_PUBLIC_SUPABASE_ANON_KEY cũ). " +
        "Sao chép .env.example thành .env.local và điền giá trị.",
    );
  }
}
