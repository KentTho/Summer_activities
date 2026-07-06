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

export interface SessionActionState {
  error?: string;
  ok?: boolean;
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
export async function closeSession(formData: FormData): Promise<void> {
  const id = z.string().uuid().safeParse(formData.get("session_id"));
  if (!id.success) return;
  const supabase = await createSupabaseServerClient();
  await supabase
    .from("activity_sessions")
    .update({ closed_at: new Date().toISOString() })
    .eq("id", id.data)
    .is("closed_at", null);
  revalidatePath(`${SESSIONS_PATH}/${id.data}`);
  revalidatePath(SESSIONS_PATH);
}

/** Mở lại buổi đã chốt (cho sửa tiếp). */
export async function reopenSession(formData: FormData): Promise<void> {
  const id = z.string().uuid().safeParse(formData.get("session_id"));
  if (!id.success) return;
  const supabase = await createSupabaseServerClient();
  await supabase
    .from("activity_sessions")
    .update({ closed_at: null })
    .eq("id", id.data);
  revalidatePath(`${SESSIONS_PATH}/${id.data}`);
  revalidatePath(SESSIONS_PATH);
}
