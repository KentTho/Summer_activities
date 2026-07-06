"use server";

/**
 * Phụ huynh gửi đơn xin nghỉ — đi qua RLS. RLS (leave_insert) chỉ cho gửi khi là
 * phụ huynh của học sinh (is_guardian_of). KHÔNG service role.
 */
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth/session";

export interface LeaveActionState {
  error?: string;
  ok?: boolean;
}

const PARENT_LEAVE_PATH = "/user/parent/leave-requests";

const submitSchema = z.object({
  student_id: z.string().uuid("Chưa chọn học sinh hợp lệ."),
  session_id: z
    .string()
    .uuid()
    .optional()
    .or(z.literal(""))
    .transform((v) => (v ? v : null)),
  reason: z
    .string()
    .trim()
    .max(500)
    .optional()
    .transform((v) => (v ? v : null)),
});

export async function submitLeaveRequest(
  _prev: LeaveActionState,
  formData: FormData,
): Promise<LeaveActionState> {
  const parsed = submitSchema.safeParse({
    student_id: formData.get("student_id"),
    session_id: formData.get("session_id") ?? "",
    reason: formData.get("reason") ?? "",
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ." };
  }

  const profile = await getCurrentProfile();
  if (!profile) return { error: "Phiên đăng nhập không hợp lệ." };

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("leave_requests").insert({
    student_id: parsed.data.student_id,
    session_id: parsed.data.session_id,
    reason: parsed.data.reason,
    status: "SUBMITTED",
    submitted_by: profile.profileId,
  });

  if (error) {
    return {
      error:
        "Không gửi được đơn (kiểm tra bạn là phụ huynh của học sinh này). " + error.message,
    };
  }

  revalidatePath(PARENT_LEAVE_PATH);
  return { ok: true };
}
