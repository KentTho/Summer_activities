import { redirect } from "next/navigation";

/**
 * 10F: "Đơn xin nghỉ" gộp vào trang vận hành `/operations` (tab "leave").
 * Giữ route cũ redirect để không 404 với link/bookmark cũ.
 */
export default function SecretaryLeaveRequestsRedirect() {
  redirect("/user/secretary/operations?tab=leave");
}
