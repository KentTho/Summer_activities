/**
 * Ghi audit log cho thao tác Admin (append-only). Đi qua RLS server client
 * (actor = Admin hiện tại). audit_logs KHÔNG có policy update/delete → bất biến.
 * KHÔNG ghi mật khẩu/token/PII nhạy cảm vào detail.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";
import type { CurrentProfile } from "@/lib/auth/session";

export interface AuditEntry {
  action: string;
  entity?: string;
  detail?: string;
}

export async function logAudit(
  supabase: SupabaseClient<Database>,
  actor: CurrentProfile,
  entry: AuditEntry,
): Promise<void> {
  // Không chặn nghiệp vụ nếu ghi audit lỗi; chỉ log server-side (không PII).
  const { error } = await supabase.from("audit_logs").insert({
    actor_id: actor.profileId,
    actor_role: actor.role,
    action: entry.action,
    entity: entry.entity ?? null,
    detail: entry.detail ?? null,
  });
  if (error) console.error("[audit] insert failed:", error.message);
}
