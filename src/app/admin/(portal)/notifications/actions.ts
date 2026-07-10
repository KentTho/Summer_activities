"use server";

/**
 * Admin gửi thông báo hệ thống hoặc theo Khu phố. requireAdmin() BẮT BUỘC.
 * Qua RLS (notif_insert/nr_insert: admin) — KHÔNG service role, KHÔNG SMS/email thật.
 * Ghi audit (không PII). Recipients:
 *  - SYSTEM: mọi hồ sơ active (trừ chính người gửi).
 *  - NEIGHBORHOOD: phụ huynh (có tài khoản) của học sinh thuộc Khu phố đã chọn.
 */
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth/require-admin";
import { logAudit } from "@/lib/admin/audit";
import {
  getNeighborhoodParentProfileIds,
  sendNotificationToProfiles,
} from "@/lib/data/notifications";

export interface SystemNotifState {
  error?: string;
  ok?: boolean;
  count?: number;
}

const schema = z
  .object({
    title: z.string().trim().min(2, "Tiêu đề quá ngắn.").max(150),
    body: z.string().trim().max(2000).optional().transform((v) => (v ? v : null)),
    scope: z.enum(["SYSTEM", "NEIGHBORHOOD"]),
    neighborhood_id: z.string().uuid().optional().or(z.literal("")),
  })
  .refine((d) => d.scope !== "NEIGHBORHOOD" || (d.neighborhood_id && d.neighborhood_id.length > 0), {
    message: "Chọn Khu phố khi gửi theo phạm vi Khu phố.",
    path: ["neighborhood_id"],
  });

export async function sendSystemNotification(
  _prev: SystemNotifState,
  formData: FormData,
): Promise<SystemNotifState> {
  const admin = await requireAdmin();
  const parsed = schema.safeParse({
    title: formData.get("title"),
    body: formData.get("body") ?? "",
    scope: formData.get("scope"),
    neighborhood_id: formData.get("neighborhood_id") ?? "",
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ." };
  }

  const supabase = await createSupabaseServerClient();

  let recipients: string[] = [];
  if (parsed.data.scope === "SYSTEM") {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id")
      .eq("active", true);
    recipients = (profiles ?? []).map((p) => p.id).filter((id) => id !== admin.profileId);
  } else {
    recipients = await getNeighborhoodParentProfileIds(supabase, [parsed.data.neighborhood_id as string]);
  }

  if (recipients.length === 0) {
    return { error: "Không có người nhận phù hợp (kiểm tra tài khoản/liên kết phụ huynh)." };
  }

  let count: number;
  try {
    count = await sendNotificationToProfiles(
      supabase,
      {
        title: parsed.data.title,
        body: parsed.data.body,
        scope: parsed.data.scope,
        neighborhoodId: parsed.data.scope === "NEIGHBORHOOD" ? (parsed.data.neighborhood_id as string) : null,
        createdBy: admin.profileId,
      },
      recipients,
    );
  } catch {
    return { error: "Không gửi được thông báo (thử lại)." };
  }

  await logAudit(supabase, admin, {
    action: "SEND_SYSTEM_NOTIFICATION",
    entity: "notifications",
    detail: `${parsed.data.scope} · ${count} người nhận`,
  });
  revalidatePath("/admin/notifications");
  return { ok: true, count };
}
