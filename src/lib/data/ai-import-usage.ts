/**
 * Đọc/tiêu thụ hạn mức AI import (server-only, qua RLS + RPC SECURITY DEFINER).
 * Không dùng service role: RPC `consume_ai_import_quota` chạy dưới quyền owner nhưng
 * chỉ tác động lên lượt của chính người gọi (`current_profile_id()`).
 */
import "server-only";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { env } from "@/lib/env";

export interface AiUsage {
  used: number;
  limit: number;
  remaining: number;
}

/** Lượt AI đã dùng hôm nay của người đăng nhập (cho UI hiển thị lượt còn lại). */
export async function getAiUsageToday(): Promise<AiUsage> {
  const supabase = await createSupabaseServerClient();
  const limit = env.aiImportDailyLimit;
  const { data, error } = await supabase.rpc("my_ai_import_usage_today");
  const used = error || typeof data !== "number" ? 0 : data;
  return { used, limit, remaining: Math.max(0, limit - used) };
}

export interface ConsumeResult {
  allowed: boolean;
  used: number;
  limit: number;
}

/**
 * Tăng 1 lượt AI import cho người đăng nhập nếu chưa vượt hạn (atomic ở DB).
 * Trả `allowed=false` khi đã đạt hạn → nơi gọi KHÔNG gọi Gemini, báo nhập tay.
 * Lỗi RPC → coi như không cho phép (an toàn quota), nhưng vẫn cho nhập tay.
 */
export async function consumeAiQuota(): Promise<ConsumeResult> {
  const supabase = await createSupabaseServerClient();
  const limit = env.aiImportDailyLimit;
  const { data, error } = await supabase.rpc("consume_ai_import_quota", { p_limit: limit });
  if (error || !data || data.length === 0) {
    return { allowed: false, used: limit, limit };
  }
  const row = data[0];
  return { allowed: row.allowed, used: row.used, limit: row.limit_value };
}
