/**
 * Supabase server client (Server Components, Route Handlers, Server Actions).
 * Next 16: cookies() là async — phải await trước khi dùng.
 * Phase 1: cấu hình mẫu; các thao tác DB thật triển khai ở phase sau.
 */
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { env } from "@/lib/env";

export async function createSupabaseServerClient() {
  const cookieStore = await cookies();

  return createServerClient(env.supabaseUrl, env.supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Được gọi từ Server Component — bỏ qua; việc refresh session do proxy.ts đảm nhiệm.
        }
      },
    },
  });
}
