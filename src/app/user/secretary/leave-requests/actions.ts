"use server";

/**
 * Bí thư xử lý đơn xin nghỉ — đi qua RLS (leave_update: can_access_student).
 * Duyệt (ACKNOWLEDGED) → GỢI Ý ghi điểm danh EXCUSED cho đúng buổi (nếu buổi còn mở).
 * KHÔNG service role.
 */
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth/session";

const SECRETARY_LEAVE_PATH = "/user/secretary/leave-requests";

async function handleLeave(
  formData: FormData,
  decision: "ACKNOWLEDGED" | "REJECTED",
): Promise<void> {
  const id = z.string().uuid().safeParse(formData.get("leave_id"));
  if (!id.success) return;

  const profile = await getCurrentProfile();
  if (!profile) return;

  const supabase = await createSupabaseServerClient();

  const { data: leave } = await supabase
    .from("leave_requests")
    .select("student_id, session_id, status")
    .eq("id", id.data)
    .maybeSingle();
  if (!leave) return;

  const { error } = await supabase
    .from("leave_requests")
    .update({ status: decision, handled_by: profile.profileId })
    .eq("id", id.data);
  if (error) return;

  // Duyệt + có buổi cụ thể + buổi còn mở → ghi nghỉ có phép (gợi ý, có thể sửa sau).
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
      revalidatePath(`/user/secretary/sessions/${leave.session_id}`);
    }
  }

  revalidatePath(SECRETARY_LEAVE_PATH);
}

export async function acknowledgeLeave(formData: FormData): Promise<void> {
  await handleLeave(formData, "ACKNOWLEDGED");
}

export async function rejectLeave(formData: FormData): Promise<void> {
  await handleLeave(formData, "REJECTED");
}
