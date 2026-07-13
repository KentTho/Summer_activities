"use server";

/**
 * Server Actions buổi sinh hoạt cho Bí thư — đi qua RLS (KHÔNG service role).
 * Bí thư chỉ tạo/sửa buổi thuộc Khu phố mình phụ trách (đảm bảo bởi RLS +
 * policy snb_insert cho phép người tạo gắn Khu phố trong phạm vi).
 */
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth/session";
import { logAudit } from "@/lib/admin/audit";
import {
  getSessionRecipientProfileIds,
  sendNotificationToProfiles,
} from "@/lib/data/notifications";

/**
 * Tự gửi thông báo (scope SESSION) cho phụ huynh liên quan buổi khi hủy/dời.
 * Best-effort: lỗi thông báo KHÔNG chặn nghiệp vụ chính. Ghi audit (không PII).
 */
async function autoNotifySession(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  sessionId: string,
  title: string,
  body: string,
): Promise<void> {
  try {
    const profile = await getCurrentProfile();
    if (!profile) return;
    const recipients = await getSessionRecipientProfileIds(supabase, sessionId);
    if (recipients.length === 0) return;
    const count = await sendNotificationToProfiles(
      supabase,
      { title, body, scope: "SESSION", sessionId, createdBy: profile.profileId },
      recipients,
    );
    await logAudit(supabase, profile, {
      action: "NOTIFY_SESSION_PARENTS",
      entity: "notifications",
      detail: `session ${sessionId} · ${count} người nhận`,
    });
  } catch {
    // Không chặn hủy/dời buổi nếu gửi thông báo lỗi.
  }
}

export interface SessionActionState {
  error?: string;
  ok?: boolean;
  /** Thông báo thành công (để client hiển thị toast). */
  message?: string;
}

const SESSIONS_PATH = "/user/secretary/sessions";

const sessionSchema = z.object({
  title: z.string().trim().min(2, "Tên buổi quá ngắn.").max(150),
  session_date: z
    .string()
    .trim()
    .regex(/^\d{4}-\d{2}-\d{2}$/u, "Ngày sinh hoạt phải dạng YYYY-MM-DD."),
  start_time: z
    .string()
    .trim()
    .regex(/^\d{2}:\d{2}$/u, "Giờ phải dạng HH:MM.")
    .optional()
    .or(z.literal(""))
    .transform((v) => (v ? v : null)),
  session_type: z.enum(["REGULAR", "JOINT"]),
  location: z.string().trim().max(200).optional().transform((v) => (v ? v : null)),
});

export async function createSession(
  _prev: SessionActionState,
  formData: FormData,
): Promise<SessionActionState> {
  const parsed = sessionSchema.safeParse({
    title: formData.get("title"),
    session_date: formData.get("session_date"),
    start_time: formData.get("start_time") ?? "",
    session_type: formData.get("session_type"),
    location: formData.get("location") ?? "",
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ." };
  }

  const neighborhoodIds = formData
    .getAll("neighborhood_ids")
    .map((v) => String(v))
    .filter((v) => z.string().uuid().safeParse(v).success);
  if (neighborhoodIds.length === 0) {
    return { error: "Chọn ít nhất một Khu phố cho buổi sinh hoạt." };
  }

  const profile = await getCurrentProfile();
  if (!profile) return { error: "Phiên đăng nhập không hợp lệ." };

  const supabase = await createSupabaseServerClient();

  // Sinh id ở server để KHÔNG phụ thuộc returning-select (buổi mới chưa gắn Khu phố
  // nên chưa "select được" qua can_access_session — tránh lỗi RLS on returning).
  const sessionId = crypto.randomUUID();
  const { error } = await supabase
    .from("activity_sessions")
    .insert({ id: sessionId, ...parsed.data, created_by: profile.profileId });
  if (error) {
    return { error: "Không thể tạo buổi. " + error.message };
  }

  const links = neighborhoodIds.map((neighborhood_id) => ({
    session_id: sessionId,
    neighborhood_id,
  }));
  const { error: linkErr } = await supabase.from("session_neighborhoods").insert(links);
  if (linkErr) {
    // Buổi đã tạo nhưng chưa gắn được Khu phố (thường do ngoài phạm vi phụ trách).
    return {
      error:
        "Đã tạo buổi nhưng không gắn được Khu phố (kiểm tra bạn có phụ trách Khu phố đã chọn). " +
        linkErr.message,
    };
  }

  revalidatePath(SESSIONS_PATH);
  redirect(`${SESSIONS_PATH}/${sessionId}`);
}

/** Chốt buổi: đặt closed_at = now. Sau khi chốt không cho sửa điểm danh. */
export async function closeSession(
  _prev: SessionActionState,
  formData: FormData,
): Promise<SessionActionState> {
  const id = z.string().uuid().safeParse(formData.get("session_id"));
  if (!id.success) return { error: "Buổi không hợp lệ." };
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("activity_sessions")
    .update({ closed_at: new Date().toISOString() })
    .eq("id", id.data)
    .is("closed_at", null);
  if (error) return { error: "Không thể chốt buổi. Vui lòng thử lại." };
  revalidatePath(`${SESSIONS_PATH}/${id.data}`);
  revalidatePath(SESSIONS_PATH);
  return { ok: true, message: "Đã chốt buổi." };
}

/** Mở lại buổi đã chốt (cho sửa tiếp). */
export async function reopenSession(
  _prev: SessionActionState,
  formData: FormData,
): Promise<SessionActionState> {
  const id = z.string().uuid().safeParse(formData.get("session_id"));
  if (!id.success) return { error: "Buổi không hợp lệ." };
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("activity_sessions")
    .update({ closed_at: null })
    .eq("id", id.data);
  if (error) return { error: "Không thể mở lại buổi. Vui lòng thử lại." };
  revalidatePath(`${SESSIONS_PATH}/${id.data}`);
  revalidatePath(SESSIONS_PATH);
  return { ok: true, message: "Đã mở lại buổi." };
}

/** Dừng/hủy buổi (canceled_at). Có thể hoàn tác bằng uncancelSession. */
export async function cancelSession(
  _prev: SessionActionState,
  formData: FormData,
): Promise<SessionActionState> {
  const id = z.string().uuid().safeParse(formData.get("session_id"));
  if (!id.success) return { error: "Buổi không hợp lệ." };
  const reason = String(formData.get("reason") ?? "").trim().slice(0, 500);
  const supabase = await createSupabaseServerClient();
  const { data: session } = await supabase
    .from("activity_sessions")
    .select("title, session_date, canceled_at")
    .eq("id", id.data)
    .maybeSingle();
  const { error } = await supabase
    .from("activity_sessions")
    .update({ canceled_at: new Date().toISOString() })
    .eq("id", id.data)
    .is("canceled_at", null);
  if (error) return { error: "Không thể hủy buổi. Vui lòng thử lại." };

  // Chỉ thông báo khi vừa chuyển sang HỦY (trước đó chưa hủy).
  if (session && !session.canceled_at) {
    const body =
      `Buổi sinh hoạt "${session.title}"` +
      (session.session_date ? ` (ngày ${session.session_date})` : "") +
      ` đã bị hủy.` +
      (reason ? ` Lý do: ${reason}` : "");
    await autoNotifySession(supabase, id.data, `Hủy buổi: ${session.title}`, body);
  }
  revalidatePath(`${SESSIONS_PATH}/${id.data}`);
  revalidatePath(SESSIONS_PATH);
  return { ok: true, message: "Đã hủy buổi và gửi thông báo phụ huynh (nếu có)." };
}

export async function uncancelSession(
  _prev: SessionActionState,
  formData: FormData,
): Promise<SessionActionState> {
  const id = z.string().uuid().safeParse(formData.get("session_id"));
  if (!id.success) return { error: "Buổi không hợp lệ." };
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("activity_sessions")
    .update({ canceled_at: null })
    .eq("id", id.data);
  if (error) return { error: "Không thể khôi phục buổi. Vui lòng thử lại." };
  revalidatePath(`${SESSIONS_PATH}/${id.data}`);
  revalidatePath(SESSIONS_PATH);
  return { ok: true, message: "Đã khôi phục buổi." };
}

const rescheduleSchema = z.object({
  session_id: z.string().uuid(),
  session_date: z.string().trim().regex(/^\d{4}-\d{2}-\d{2}$/u),
  start_time: z
    .string()
    .trim()
    .regex(/^\d{2}:\d{2}$/u)
    .or(z.literal(""))
    .optional(),
});

/** Dời buổi sang ngày khác (+ giờ nếu có). */
export async function rescheduleSession(
  _prev: SessionActionState,
  formData: FormData,
): Promise<SessionActionState> {
  const parsed = rescheduleSchema.safeParse({
    session_id: formData.get("session_id"),
    session_date: formData.get("session_date"),
    start_time: formData.get("start_time") ?? "",
  });
  if (!parsed.success) return { error: "Ngày/giờ dời không hợp lệ." };
  const supabase = await createSupabaseServerClient();
  const { data: before } = await supabase
    .from("activity_sessions")
    .select("title, session_date, start_time")
    .eq("id", parsed.data.session_id)
    .maybeSingle();
  const patch: { session_date: string; start_time?: string | null } = {
    session_date: parsed.data.session_date,
  };
  if (parsed.data.start_time !== undefined) {
    patch.start_time = parsed.data.start_time ? parsed.data.start_time : null;
  }
  const { error } = await supabase
    .from("activity_sessions")
    .update(patch)
    .eq("id", parsed.data.session_id);
  if (error) return { error: "Không thể dời buổi. Vui lòng thử lại." };

  const nextStartTime =
    parsed.data.start_time !== undefined
      ? parsed.data.start_time
        ? parsed.data.start_time
        : null
      : before?.start_time ?? null;
  if (before && (before.session_date !== patch.session_date || before.start_time !== nextStartTime)) {
    const oldWhen = `${before.session_date}${before.start_time ? ` ${before.start_time}` : ""}`;
    const newWhen = `${patch.session_date}${nextStartTime ? ` ${nextStartTime}` : ""}`;
    const body = `Buổi sinh hoạt "${before.title}" đổi lịch từ ${oldWhen} sang ${newWhen}.`;
    await autoNotifySession(supabase, parsed.data.session_id, `Đổi lịch: ${before.title}`, body);
  }
  revalidatePath(`${SESSIONS_PATH}/${parsed.data.session_id}`);
  revalidatePath(SESSIONS_PATH);
  return { ok: true, message: "Đã dời buổi và gửi thông báo phụ huynh (nếu có)." };
}

export interface NotifyState {
  error?: string;
  ok?: boolean;
  count?: number;
}

const notifySchema = z.object({
  session_id: z.string().uuid(),
  title: z.string().trim().min(2, "Tiêu đề quá ngắn.").max(150),
  body: z.string().trim().max(1000).optional().transform((v) => (v ? v : null)),
});

/**
 * Bí thư/Chi Đoàn gửi thông báo cho phụ huynh liên quan buổi (scope SESSION).
 * Người nhận = phụ huynh của học sinh thuộc Khu phố của buổi. Qua RLS (không service role).
 */
export async function notifySessionParents(
  _prev: NotifyState,
  formData: FormData,
): Promise<NotifyState> {
  const parsed = notifySchema.safeParse({
    session_id: formData.get("session_id"),
    title: formData.get("title"),
    body: formData.get("body") ?? "",
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ." };

  const profile = await getCurrentProfile();
  if (!profile) return { error: "Phiên đăng nhập không hợp lệ." };

  const supabase = await createSupabaseServerClient();

  const profileIds = await getSessionRecipientProfileIds(supabase, parsed.data.session_id);
  if (profileIds.length === 0) {
    return { error: "Không tìm thấy phụ huynh có tài khoản nhận thông báo cho buổi này." };
  }

  let count = 0;
  try {
    count = await sendNotificationToProfiles(
      supabase,
      {
        title: parsed.data.title,
        body: parsed.data.body,
        scope: "SESSION",
        sessionId: parsed.data.session_id,
        createdBy: profile.profileId,
      },
      profileIds,
    );
  } catch {
    return { error: "Không gửi được thông báo. Vui lòng thử lại." };
  }

  revalidatePath(`${SESSIONS_PATH}/${parsed.data.session_id}`);
  return { ok: true, count };
}
