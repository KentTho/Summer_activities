/**
 * Helper refresh phiên Supabase trong proxy.ts (Next 16 đổi tên middleware -> proxy).
 * Trả về NextResponse đã đồng bộ cookie phiên + user hiện tại (null nếu chưa đăng nhập).
 *
 * Nếu chưa cấu hình Supabase env thì pass-through (user = null) để scaffold chạy được.
 * Guard theo vai trò (role) do server layout đảm nhiệm; RLS là chặn cuối cùng.
 */
import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import type { User } from "@supabase/supabase-js";
import { env, hasSupabaseEnv } from "@/lib/env";
import type { Database } from "@/lib/database.types";

export interface SupabaseSessionResult {
  response: NextResponse;
  user: User | null;
}

export async function updateSupabaseSession(
  request: NextRequest,
): Promise<SupabaseSessionResult> {
  const response = NextResponse.next({ request });

  if (!hasSupabaseEnv()) {
    // Chưa kết nối DB thật — không chặn request.
    return { response, user: null };
  }

  const supabase = createServerClient<Database>(
    env.supabaseUrl,
    env.supabasePublishableKey,
    {
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
    },
  );

  // Chạm tới auth để token được refresh và ghi lại cookie.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return { response, user };
}
