/**
 * Helper refresh phiên Supabase trong proxy.ts (Next 16 đổi tên middleware -> proxy).
 * Trả về NextResponse đã đồng bộ cookie phiên.
 *
 * Phase 1: nếu chưa cấu hình Supabase env thì trả về pass-through để scaffold chạy được.
 * Route guard thật (kiểm tra role + phạm vi) triển khai từ Phase 1.5/2 dựa trên khung này.
 */
import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { env, hasSupabaseEnv } from "@/lib/env";

export async function updateSupabaseSession(
  request: NextRequest,
): Promise<NextResponse> {
  const response = NextResponse.next({ request });

  if (!hasSupabaseEnv()) {
    // Chưa kết nối DB thật — không chặn request ở Phase 1.
    return response;
  }

  const supabase = createServerClient(env.supabaseUrl, env.supabasePublishableKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options);
        }
      },
    },
  });

  // Chạm tới auth để token được refresh và ghi lại cookie.
  await supabase.auth.getUser();

  return response;
}
