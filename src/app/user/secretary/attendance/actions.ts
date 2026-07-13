"use server";

/**
 * Ghi điểm danh — đi qua RLS (KHÔNG service role). RLS chỉ cho ghi khi Bí thư có
 * quyền trên buổi VÀ trên học sinh. Không cho sửa khi buổi ĐÃ CHỐT (closed_at)
 * hoặc ĐÃ HỦY (canceled_at). NOT_MARKED = xóa bản ghi (không lưu trạng thái
 * "chưa điểm danh" vào DB).
 *
 * 10E: action trả về kết quả có cấu trúc để client cập nhật optimistic + toast.
 * KHÔNG revalidatePath cả trang (tránh reload nặng) — trang force-dynamic sẽ
 * fetch lại khi điều hướng/refresh; RLS vẫn là guard cuối.
 */
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth/session";

const markSchema = z.object({
  session_id: z.string().uuid(),
  student_id: z.string().uuid(),
  status: z.enum(["PRESENT", "EXCUSED", "UNEXCUSED", "NOT_MARKED"]),
});

export interface MarkResult {
  ok: boolean;
  error?: string;
}

/**
 * Ghi điểm danh cho một học sinh trong một buổi. Nhận input đã serialize (gọi từ
 * client component). Trả về { ok } để client giữ/rollback trạng thái optimistic.
 */
export async function markAttendanceAction(input: {
  sessionId: string;
  studentId: string;
  status: "PRESENT" | "EXCUSED" | "UNEXCUSED" | "NOT_MARKED";
}): Promise<MarkResult> {
  const parsed = markSchema.safeParse({
    session_id: input.sessionId,
    student_id: input.studentId,
    status: input.status,
  });
  if (!parsed.success) return { ok: false, error: "Dữ liệu điểm danh không hợp lệ." };

  const profile = await getCurrentProfile();
  if (!profile) return { ok: false, error: "Phiên đăng nhập không hợp lệ." };

  const supabase = await createSupabaseServerClient();

  // Chốt/hủy buổi thì khóa sửa (kiểm tra ở tầng ứng dụng; RLS lo phần "ai được ghi").
  const { data: session } = await supabase
    .from("activity_sessions")
    .select("closed_at, canceled_at")
    .eq("id", parsed.data.session_id)
    .maybeSingle();
  if (!session) return { ok: false, error: "Không tìm thấy buổi sinh hoạt." };
  if (session.closed_at) return { ok: false, error: "Buổi đã chốt — không thể sửa điểm danh." };
  if (session.canceled_at) return { ok: false, error: "Buổi đã hủy — không thể sửa điểm danh." };

  if (parsed.data.status === "NOT_MARKED") {
    const { error } = await supabase
      .from("attendance_records")
      .delete()
      .eq("session_id", parsed.data.session_id)
      .eq("student_id", parsed.data.student_id);
    if (error) return { ok: false, error: "Không thể bỏ trạng thái. Vui lòng thử lại." };
  } else {
    const { error } = await supabase.from("attendance_records").upsert(
      {
        session_id: parsed.data.session_id,
        student_id: parsed.data.student_id,
        status: parsed.data.status,
        marked_by: profile.profileId,
        marked_at: new Date().toISOString(),
      },
      { onConflict: "session_id,student_id" },
    );
    if (error) return { ok: false, error: "Không thể lưu điểm danh. Vui lòng thử lại." };
  }

  return { ok: true };
}
