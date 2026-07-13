import { redirect } from "next/navigation";

/**
 * 10F: "Điểm danh" không còn là mục điều hướng riêng — điểm danh nằm trong chi
 * tiết từng buổi. Route cũ redirect về hub "Buổi sinh hoạt" để không 404 với link cũ.
 */
export default function SecretaryAttendanceRedirect() {
  redirect("/user/secretary/sessions");
}
