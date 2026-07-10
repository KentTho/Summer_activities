"use server";

/**
 * CRUD học sinh cho Bí thư — đi qua RLS (server client, KHÔNG service role).
 * RLS đảm bảo Bí thư chỉ thao tác học sinh thuộc Khu phố phụ trách; hard-delete là
 * đặc quyền Admin nên "xóa" ở đây là XÓA MỀM (deleted_at) + ngừng hoạt động.
 */
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth/session";

export interface StudentActionState {
  error?: string;
  ok?: boolean;
}

const STUDENTS_PATH = "/user/secretary/students";

const optionalText = z
  .string()
  .trim()
  .max(150)
  .optional()
  .transform((v) => (v ? v : null));

const studentSchema = z.object({
  full_name: z.string().trim().min(2, "Họ tên quá ngắn.").max(120),
  neighborhood_id: z.string().uuid("Chưa chọn Khu phố hợp lệ."),
  birth_year: z
    .string()
    .trim()
    .regex(/^\d{4}$/u, "Năm sinh phải là 4 chữ số.")
    .refine((v) => Number(v) >= 1990 && Number(v) <= 2100, "Năm sinh ngoài khoảng hợp lệ.")
    .optional()
    .or(z.literal(""))
    .transform((v) => (v ? Number(v) : null)),
  birth_date: z
    .string()
    .trim()
    .regex(/^\d{4}-\d{2}-\d{2}$/u, "Ngày sinh phải dạng YYYY-MM-DD.")
    .optional()
    .or(z.literal(""))
    .transform((v) => (v ? v : null)),
  gender: z
    .enum(["MALE", "FEMALE", "OTHER", "UNKNOWN"])
    .or(z.literal(""))
    .optional()
    .transform((v) => (v ? v : null)),
  signature_present: z
    .enum(["true", "false"])
    .or(z.literal(""))
    .optional()
    .transform((v) => (v === "true" ? true : v === "false" ? false : null)),
  signature_note: z
    .string()
    .trim()
    .max(200)
    .optional()
    .transform((v) => (v ? v : null)),
  guardian_phone: z
    .string()
    .trim()
    .regex(/^(0|\+84)\d{9}$/u, "SĐT phụ huynh không hợp lệ.")
    .optional()
    .or(z.literal(""))
    .transform((v) => (v ? v : null)),
  guardian_name: optionalText,
  school: optionalText,
  active: z.preprocess((v) => v === "on" || v === "true" || v === true, z.boolean()),
});

function parseForm(formData: FormData) {
  return studentSchema.safeParse({
    full_name: formData.get("full_name"),
    neighborhood_id: formData.get("neighborhood_id"),
    birth_year: formData.get("birth_year") ?? "",
    birth_date: formData.get("birth_date") ?? "",
    gender: formData.get("gender") ?? "",
    signature_present: formData.get("signature_present") ?? "",
    signature_note: formData.get("signature_note") ?? "",
    guardian_phone: formData.get("guardian_phone") ?? "",
    guardian_name: formData.get("guardian_name") ?? "",
    school: formData.get("school") ?? "",
    active: formData.get("active"),
  });
}

export async function createStudent(
  _prev: StudentActionState,
  formData: FormData,
): Promise<StudentActionState> {
  const parsed = parseForm(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ." };
  }

  const profile = await getCurrentProfile();
  if (!profile) return { error: "Phiên đăng nhập không hợp lệ." };

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("students").insert({
    ...parsed.data,
    created_by: profile.profileId,
  });

  if (error) {
    return {
      error:
        "Không thể thêm học sinh (kiểm tra bạn có quyền với Khu phố này). " +
        error.message,
    };
  }

  revalidatePath(STUDENTS_PATH);
  return { ok: true };
}

export async function updateStudent(
  _prev: StudentActionState,
  formData: FormData,
): Promise<StudentActionState> {
  const id = z.string().uuid().safeParse(formData.get("id"));
  if (!id.success) return { error: "Thiếu mã học sinh." };

  const parsed = parseForm(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ." };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("students")
    .update(parsed.data)
    .eq("id", id.data);

  if (error) return { error: "Không thể cập nhật học sinh. " + error.message };

  revalidatePath(STUDENTS_PATH);
  return { ok: true };
}

/** Xóa mềm: đánh dấu deleted_at + ngừng hoạt động. RLS: update trong phạm vi Khu phố. */
export async function softDeleteStudent(
  formData: FormData,
): Promise<void> {
  const id = z.string().uuid().safeParse(formData.get("id"));
  if (!id.success) return;

  const supabase = await createSupabaseServerClient();
  await supabase
    .from("students")
    .update({ deleted_at: new Date().toISOString(), active: false })
    .eq("id", id.data);

  revalidatePath(STUDENTS_PATH);
}
