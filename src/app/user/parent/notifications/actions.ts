"use server";

/**
 * Đánh dấu đã đọc thông báo (người nhận). Qua RLS nr_update (chỉ dòng của mình).
 */
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { markAllNotificationsRead, markNotificationRead } from "@/lib/data/notifications";

const PATH = "/user/parent/notifications";

export async function markNotificationReadAction(formData: FormData): Promise<void> {
  const id = z.string().uuid().safeParse(formData.get("notification_id"));
  if (!id.success) return;
  await markNotificationRead(id.data);
  revalidatePath(PATH);
}

export async function markAllReadAction(): Promise<void> {
  await markAllNotificationsRead();
  revalidatePath(PATH);
}
