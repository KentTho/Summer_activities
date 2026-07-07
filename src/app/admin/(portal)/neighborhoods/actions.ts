"use server";

/**
 * Server Actions quản lý Khu phố (danh mục). requireAdmin() BẮT BUỘC.
 * Ghi/sửa qua RLS server client (neigh_insert/neigh_update chỉ cho is_admin()).
 * "Ngừng hoạt động" = đặt active=false (KHÔNG hard-delete Khu phố đã có dữ liệu).
 */
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth/require-admin";
import { logAudit } from "@/lib/admin/audit";

export interface NeighborhoodActionState {
  error?: string;
  ok?: boolean;
}

const neighborhoodSchema = z.object({
  code: z
    .string()
    .trim()
    .min(1, "Mã Khu phố không được trống.")
    .max(30, "Mã Khu phố quá dài.")
    .regex(/^[A-Za-z0-9._-]+$/, "Mã chỉ gồm chữ, số, dấu . _ -"),
  name: z.string().trim().min(2, "Tên Khu phố quá ngắn.").max(120, "Tên Khu phố quá dài."),
});

function revalidateNeighborhoods(): void {
  revalidatePath("/admin/neighborhoods");
  revalidatePath("/admin/assignments");
  revalidatePath("/admin/secretaries");
}

export async function createNeighborhood(
  _prev: NeighborhoodActionState,
  formData: FormData,
): Promise<NeighborhoodActionState> {
  const admin = await requireAdmin();
  const parsed = neighborhoodSchema.safeParse({
    code: formData.get("code"),
    name: formData.get("name"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ." };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("neighborhoods")
    .insert({ code: parsed.data.code, name: parsed.data.name, active: true });
  if (error) {
    if (error.code === "23505") return { error: "Mã Khu phố đã tồn tại." };
    return { error: "Tạo Khu phố thất bại. " + error.message };
  }

  await logAudit(supabase, admin, {
    action: "CREATE_NEIGHBORHOOD",
    entity: "neighborhoods",
    detail: `${parsed.data.code} · ${parsed.data.name}`,
  });
  revalidateNeighborhoods();
  return { ok: true };
}

export async function updateNeighborhood(formData: FormData): Promise<void> {
  const admin = await requireAdmin();
  const id = z.string().uuid().safeParse(formData.get("id"));
  const parsed = neighborhoodSchema.safeParse({
    code: formData.get("code"),
    name: formData.get("name"),
  });
  if (!id.success || !parsed.success) return;

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("neighborhoods")
    .update({ code: parsed.data.code, name: parsed.data.name })
    .eq("id", id.data);
  if (error) return;

  await logAudit(supabase, admin, {
    action: "UPDATE_NEIGHBORHOOD",
    entity: "neighborhoods",
    detail: `${parsed.data.code} · ${parsed.data.name}`,
  });
  revalidateNeighborhoods();
}

/** Bật/ngừng hoạt động Khu phố (không hard-delete). */
export async function setNeighborhoodActive(formData: FormData): Promise<void> {
  const admin = await requireAdmin();
  const id = z.string().uuid().safeParse(formData.get("id"));
  const active = String(formData.get("active")) === "true";
  if (!id.success) return;

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("neighborhoods").update({ active }).eq("id", id.data);
  if (error) return;

  await logAudit(supabase, admin, {
    action: active ? "ENABLE_NEIGHBORHOOD" : "DISABLE_NEIGHBORHOOD",
    entity: "neighborhoods",
    detail: id.data,
  });
  revalidateNeighborhoods();
}
