import { redirect } from "next/navigation";

/**
 * 10F: "Thông báo" gộp vào trang vận hành `/operations` (tab "notifications").
 * Giữ route cũ redirect để không 404 với link/bookmark cũ.
 */
export default function SecretaryNotificationsRedirect() {
  redirect("/user/secretary/operations?tab=notifications");
}
