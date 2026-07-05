/**
 * Route guard toàn cục (Next 16: `middleware.ts` được đổi tên thành `proxy.ts`).
 * Trách nhiệm (Prompt 05):
 *   1. Refresh phiên Supabase (đồng bộ cookie).
 *   2. Chặn truy cập route được bảo vệ khi CHƯA đăng nhập → redirect về login đúng cổng.
 *
 * Kiểm tra vai trò cụ thể (đúng cổng theo role) do server layout đảm nhiệm bằng
 * getCurrentProfile() — vì role phải đọc từ bảng profiles. RLS là chặn cuối cùng.
 */
import { NextResponse, type NextRequest } from "next/server";
import { updateSupabaseSession } from "@/lib/supabase/proxy";
import { requiredRoleForPath } from "@/lib/auth/rbac";
import { ROLES } from "@/modules/auth/domain/roles";

export async function proxy(request: NextRequest) {
  const { response, user } = await updateSupabaseSession(request);

  const pathname = request.nextUrl.pathname;
  const required = requiredRoleForPath(pathname);

  // Route được bảo vệ + chưa đăng nhập → về trang login của đúng cổng.
  if (required && !user) {
    const loginPath =
      required === ROLES.ADMIN ? "/admin/login" : "/user/login";
    const url = request.nextUrl.clone();
    url.pathname = loginPath;
    url.search = "";
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  // Bỏ qua static asset, tối ưu ảnh và metadata files.
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
