# lib/supabase

Adapter kết nối Supabase (Postgres + Auth + Storage). **Phase 1 chỉ là cấu hình mẫu** — chưa
truy vấn database thật.

| File | Dùng ở đâu | Ghi chú |
| --- | --- | --- |
| `client.ts` | Client Components | `createBrowserClient` với anon key public |
| `server.ts` | Server Components / Route Handlers / Server Actions | `cookies()` là **async** ở Next 16 |
| `proxy.ts` | `src/proxy.ts` (route guard) | refresh phiên; pass-through khi chưa có env |

## Kích hoạt kết nối thật

1. Tạo project trên Supabase.
2. Copy `.env.example` → `.env.local`, điền `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
   `SUPABASE_SERVICE_ROLE_KEY`.
3. Từ Phase 2: chạy migration trong `supabase/migrations` và bật RLS.

`SUPABASE_SERVICE_ROLE_KEY` **chỉ dùng server-side**, không bao giờ import vào Client Component.
