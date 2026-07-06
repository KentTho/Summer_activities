/**
 * Data-access thông báo (server-only, qua RLS).
 * RLS notif_select: người nhận thấy thông báo của mình; người tạo thấy thông báo đã gửi.
 * Cùng truy vấn — RLS lọc theo người đăng nhập (Bí thư = đã gửi; Phụ huynh = được nhận).
 */
import { createSupabaseServerClient } from "@/lib/supabase/server";

export interface NotificationItem {
  id: string;
  title: string;
  body: string | null;
  scope: string;
  createdAt: string;
  sessionTitle: string | null;
  sessionDate: string | null;
}

export async function listMyNotifications(limit = 50): Promise<NotificationItem[]> {
  const supabase = await createSupabaseServerClient();
  const { data: rows, error } = await supabase
    .from("notifications")
    .select("id, title, body, scope, created_at, session_id")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  if (!rows || rows.length === 0) return [];

  const sessionIds = [...new Set(rows.map((r) => r.session_id).filter((v): v is string => !!v))];
  const { data: sessions } = sessionIds.length
    ? await supabase.from("activity_sessions").select("id, title, session_date").in("id", sessionIds)
    : { data: [] as { id: string; title: string; session_date: string }[] };
  const sessionById = new Map((sessions ?? []).map((s) => [s.id, s]));

  return rows.map((r) => {
    const s = r.session_id ? sessionById.get(r.session_id) : null;
    return {
      id: r.id,
      title: r.title,
      body: r.body,
      scope: r.scope,
      createdAt: r.created_at,
      sessionTitle: s?.title ?? null,
      sessionDate: s?.session_date ?? null,
    };
  });
}
