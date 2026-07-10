/**
 * Data-access thông báo (server-only, qua RLS).
 * RLS notif_select: người nhận thấy thông báo của mình; người tạo thấy thông báo đã gửi.
 * nr_update: người nhận chỉ cập nhật read_at của CHÍNH MÌNH → mark-read an toàn.
 * Helper gửi thông báo (SESSION/NEIGHBORHOOD/SYSTEM) tránh lặp code ở các action.
 */
import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth/session";

type Server = SupabaseClient<Database>;
type Scope = Database["public"]["Enums"]["notification_scope"];

export interface NotificationItem {
  id: string;
  title: string;
  body: string | null;
  scope: string;
  createdAt: string;
  sessionTitle: string | null;
  sessionDate: string | null;
  /** read_at của người đăng nhập (null = chưa đọc; undefined = mình là người gửi). */
  readAt: string | null;
  unread: boolean;
}

export async function listMyNotifications(limit = 50): Promise<NotificationItem[]> {
  const supabase = await createSupabaseServerClient();
  const profile = await getCurrentProfile();
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

  // Trạng thái đã đọc của CHÍNH người đăng nhập (chỉ các dòng mình là người nhận).
  const readByNotif = new Map<string, string | null>();
  if (profile) {
    const { data: recs } = await supabase
      .from("notification_recipients")
      .select("notification_id, read_at")
      .eq("profile_id", profile.profileId)
      .in("notification_id", rows.map((r) => r.id));
    for (const r of recs ?? []) readByNotif.set(r.notification_id, r.read_at);
  }

  return rows.map((r) => {
    const s = r.session_id ? sessionById.get(r.session_id) : null;
    const isRecipient = readByNotif.has(r.id);
    const readAt = isRecipient ? readByNotif.get(r.id) ?? null : null;
    return {
      id: r.id,
      title: r.title,
      body: r.body,
      scope: r.scope,
      createdAt: r.created_at,
      sessionTitle: s?.title ?? null,
      sessionDate: s?.session_date ?? null,
      readAt,
      // Chỉ tính "chưa đọc" khi mình là người NHẬN và read_at rỗng (người gửi không tính).
      unread: isRecipient && readAt === null,
    };
  });
}

/** Số thông báo CHƯA ĐỌC của người đăng nhập (cho badge/near-real-time). */
export async function countMyUnreadNotifications(): Promise<number> {
  const supabase = await createSupabaseServerClient();
  const profile = await getCurrentProfile();
  if (!profile) return 0;
  const { count, error } = await supabase
    .from("notification_recipients")
    .select("id", { count: "exact", head: true })
    .eq("profile_id", profile.profileId)
    .is("read_at", null);
  if (error) return 0;
  return count ?? 0;
}

/** Đánh dấu ĐÃ ĐỌC một thông báo (chỉ dòng của chính mình — RLS nr_update). */
export async function markNotificationRead(notificationId: string): Promise<void> {
  const supabase = await createSupabaseServerClient();
  const profile = await getCurrentProfile();
  if (!profile) return;
  await supabase
    .from("notification_recipients")
    .update({ read_at: new Date().toISOString() })
    .eq("notification_id", notificationId)
    .eq("profile_id", profile.profileId)
    .is("read_at", null);
}

/** Đánh dấu ĐÃ ĐỌC tất cả thông báo của người đăng nhập. */
export async function markAllNotificationsRead(): Promise<void> {
  const supabase = await createSupabaseServerClient();
  const profile = await getCurrentProfile();
  if (!profile) return;
  await supabase
    .from("notification_recipients")
    .update({ read_at: new Date().toISOString() })
    .eq("profile_id", profile.profileId)
    .is("read_at", null);
}

/**
 * Profile phụ huynh liên quan một buổi = phụ huynh (có tài khoản) của học sinh thuộc
 * Khu phố của buổi. Đi qua RLS server client (người gọi phải có quyền với buổi/Khu phố).
 */
export async function getSessionRecipientProfileIds(
  supabase: Server,
  sessionId: string,
): Promise<string[]> {
  const { data: snb } = await supabase
    .from("session_neighborhoods")
    .select("neighborhood_id")
    .eq("session_id", sessionId);
  const nIds = (snb ?? []).map((r) => r.neighborhood_id);
  if (nIds.length === 0) return [];
  return getNeighborhoodParentProfileIds(supabase, nIds);
}

/** Profile phụ huynh (có tài khoản) của học sinh thuộc các Khu phố cho trước. */
export async function getNeighborhoodParentProfileIds(
  supabase: Server,
  neighborhoodIds: string[],
): Promise<string[]> {
  if (neighborhoodIds.length === 0) return [];
  const { data: students } = await supabase
    .from("students")
    .select("id")
    .in("neighborhood_id", neighborhoodIds)
    .is("deleted_at", null);
  const studentIds = (students ?? []).map((s) => s.id);
  if (studentIds.length === 0) return [];

  const { data: links } = await supabase
    .from("student_guardians")
    .select("guardian_id")
    .in("student_id", studentIds);
  const guardianIds = [...new Set((links ?? []).map((l) => l.guardian_id))];
  if (guardianIds.length === 0) return [];

  const { data: guardians } = await supabase
    .from("guardians")
    .select("profile_id")
    .in("id", guardianIds)
    .not("profile_id", "is", null);
  return [...new Set((guardians ?? []).map((g) => g.profile_id).filter((v): v is string => !!v))];
}

export interface NotificationInput {
  title: string;
  body: string | null;
  scope: Scope;
  sessionId?: string | null;
  neighborhoodId?: string | null;
  createdBy: string;
}

/**
 * Tạo 1 thông báo + gắn người nhận. Trả số người nhận thực tế (0 nếu rỗng).
 * Đi qua RLS (notif_insert/nr_insert: admin hoặc secretary). KHÔNG service role.
 */
export async function sendNotificationToProfiles(
  supabase: Server,
  input: NotificationInput,
  recipientProfileIds: string[],
): Promise<number> {
  const recipients = [...new Set(recipientProfileIds)];
  if (recipients.length === 0) return 0;

  const { data: notif, error: nErr } = await supabase
    .from("notifications")
    .insert({
      title: input.title,
      body: input.body,
      scope: input.scope,
      session_id: input.sessionId ?? null,
      neighborhood_id: input.neighborhoodId ?? null,
      created_by: input.createdBy,
    })
    .select("id")
    .single();
  if (nErr || !notif) throw nErr ?? new Error("Không tạo được thông báo.");

  const rows = recipients.map((profile_id) => ({ notification_id: notif.id, profile_id }));
  const { error: rErr } = await supabase.from("notification_recipients").insert(rows);
  if (rErr) {
    await supabase.from("notifications").delete().eq("id", notif.id);
    throw rErr;
  }
  return recipients.length;
}
