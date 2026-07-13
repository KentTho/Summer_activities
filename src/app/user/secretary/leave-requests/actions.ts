"use server";

/**
 * Bí thư xử lý đơn xin nghỉ — đi qua RLS (leave_update: can_access_student).
 * Duyệt (ACKNOWLEDGED) → GỢI Ý ghi điểm danh EXCUSED cho đúng buổi (nếu buổi còn mở).
 * KHÔNG service role.
 *
 * 10F: action trả về trạng thái có cấu trúc để client hiển thị toast (useActionState).
 */
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth/session";

const OPERATIONS_PATH = "/user/secretary/operations";

export interface LeaveActionState {
  ok?: boolean;
  error?: string;
  message?: string;
}

async function handleLeave(
  formData: FormData,
  decision: "ACKNOWLEDGED" | "REJECTED",
): Promise<LeaveActionState> {
  const id = z.string().uuid().safeParse(formData.get("leave_id"));
  if (!id.success) return { error: "Đơn không hợp lệ." };

  const profile = await getCurrentProfile();
  if (!profile) return { error: "Phiên đăng nhập không hợp lệ." };

  const supabase = await createSupabaseServerClient();

  const { data: leave } = await supabase
    .from("leave_requests")
    .select("student_id, session_id, status")
    .eq("id", id.data)
    .maybeSingle();
  if (!leave) return { error: "Không tìm thấy đơn xin nghỉ." };

  const { error } = await supabase
    .from("leave_requests")
    .update({ status: decision, handled_by: profile.profileId })
    .eq("id", id.data);
  if (error) return { error: "Không cập nhật được đơn. Vui lòng thử lại." };

  // Duyệt + có buổi cụ thể + buổi còn mở → ghi nghỉ có phép (gợi ý, có thể sửa sau).
  let markedExcused = false;
  if (decision === "ACKNOWLEDGED" && leave.session_id) {
    const { data: session } = await supabase
      .from("activity_sessions")
      .select("closed_at")
      .eq("id", leave.session_id)
      .maybeSingle();
    if (session && !session.closed_at) {
      await supabase.from("attendance_records").upsert(
        {
          session_id: leave.session_id,
          student_id: leave.student_id,
          status: "EXCUSED",
          marked_by: profile.profileId,
          marked_at: new Date().toISOString(),
          note: "Từ đơn xin nghỉ đã duyệt",
        },
        { onConflict: "session_id,student_id" },
      );
      markedExcused = true;
      revalidatePath(`/user/secretary/sessions/${leave.session_id}`);
    }
  }

  revalidatePath(OPERATIONS_PATH);
  return {
    ok: true,
    message:
      decision === "ACKNOWLEDGED"
        ? markedExcused
          ? "Đã ghi nhận có phép + đánh 'Nghỉ có phép' cho buổi."
          : "Đã ghi nhận đơn xin nghỉ."
        : "Đã từ chối đơn xin nghỉ.",
  };
}

export async function acknowledgeLeave(
  _prev: LeaveActionState,
  formData: FormData,
): Promise<LeaveActionState> {
  return handleLeave(formData, "ACKNOWLEDGED");
}

export async function rejectLeave(
  _prev: LeaveActionState,
  formData: FormData,
): Promise<LeaveActionState> {
  return handleLeave(formData, "REJECTED");
}
