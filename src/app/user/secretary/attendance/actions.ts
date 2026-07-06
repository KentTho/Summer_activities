"use server";

/**
 * Ghi điểm danh — đi qua RLS (KHÔNG service role). RLS chỉ cho ghi khi Bí thư có
 * quyền trên buổi VÀ trên học sinh. Không cho sửa khi buổi ĐÃ CHỐT (closed_at).
 * NOT_MARKED = xóa bản ghi (không lưu trạng thái "chưa điểm danh" vào DB).
 */
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth/session";

const markSchema = z.object({
  session_id: z.string().uuid(),
  student_id: z.string().uuid(),
  status: z.enum(["PRESENT", "EXCUSED", "UNEXCUSED", "NOT_MARKED"]),
});

export async function markAttendance(formData: FormData): Promise<void> {
  const parsed = markSchema.safeParse({
    session_id: formData.get("session_id"),
    student_id: formData.get("student_id"),
    status: formData.get("status"),
  });
  if (!parsed.success) return;

  const profile = await getCurrentProfile();
  if (!profile) return;

  const supabase = await createSupabaseServerClient();

  // Chốt/hủy buổi thì khóa sửa (kiểm tra ở tầng ứng dụng; RLS lo phần "ai được ghi").
  const { data: session } = await supabase
    .from("activity_sessions")
    .select("closed_at, canceled_at")
    .eq("id", parsed.data.session_id)
    .maybeSingle();
  if (!session || session.closed_at || session.canceled_at) return;

  if (parsed.data.status === "NOT_MARKED") {
    await supabase
      .from("attendance_records")
      .delete()
      .eq("session_id", parsed.data.session_id)
      .eq("student_id", parsed.data.student_id);
  } else {
    await supabase.from("attendance_records").upsert(
      {
        session_id: parsed.data.session_id,
        student_id: parsed.data.student_id,
        status: parsed.data.status,
        marked_by: profile.profileId,
        marked_at: new Date().toISOString(),
      },
      { onConflict: "session_id,student_id" },
    );
  }

  revalidatePath(`/user/secretary/sessions/${parsed.data.session_id}`);
}
