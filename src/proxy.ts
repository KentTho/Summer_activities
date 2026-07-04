/**
 * Route guard toàn cục (Next 16: file `middleware.ts` trong spec được đổi tên thành `proxy.ts`).
 * Trách nhiệm: refresh phiên Supabase + (Phase sau) chặn truy cập route theo vai trò.
 *
 * Phase 1 (scaffold): chỉ refresh phiên; chưa redirect vì auth thật chưa bật.
 * Khung enforcement role đã đặt sẵn ở lib/auth/rbac.ts để phase sau nối vào.
 */
import type { NextRequest } from "next/server";
import { updateSupabaseSession } from "@/lib/supabase/proxy";

export async function proxy(request: NextRequest) {
  // Đồng bộ cookie phiên (no-op khi chưa cấu hình Supabase env).
  const response = await updateSupabaseSession(request);

  // TODO(Phase 2): đọc user + role, dùng lib/auth/rbac.ts để redirect nếu không đủ quyền.
  //   const required = requiredRoleForPath(request.nextUrl.pathname);
  //   if (required && role !== required) return NextResponse.redirect(...)

  return response;
}

export const config = {
  // Bỏ qua static asset, tối ưu ảnh và metadata files.
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
