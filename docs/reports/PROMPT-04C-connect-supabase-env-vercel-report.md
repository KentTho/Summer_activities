# Báo cáo PROMPT 04C — Connect Supabase remote + env naming + Vercel env

- **Ngày:** 2026-07-05
- **Project:** Web-App Điểm danh sinh hoạt hè
- **Tiếp nối:** `PROMPT-04B-supabase-schema-rls-seed-report.md`
- **Phạm vi:** đổi env naming sang tên Supabase mới (giữ backward-compat), đẩy public
  env lên Vercel, chuẩn bị `link`/`db push`/`gen types`. **Không** làm Auth/CRUD/OCR/DOCX thật.
- **Project ref:** `ymtogeacpnlmthjlryrd` · **URL:** `https://ymtogeacpnlmthjlryrd.supabase.co`

---

## A — Trạng thái công cụ (kiểm tra thực tế)

| Công cụ | Trạng thái | Hệ quả |
| --- | --- | --- |
| Supabase CLI | ❌ Chưa cài (`supabase` not found); `npx supabase` không tự cài được trong shell non-interactive | Không thể `link` / `db push` / `gen types` ở prompt này |
| DB password | ❌ Không có (không có trong prompt, không được đoán) | Không thể `db push` (cần mật khẩu DB) hoặc direct connection |
| Supabase access token | ❌ Chưa `supabase login` | Không thể `gen types` từ remote |
| Vercel CLI | ✅ Đã login (`kenttho`), project đã link (`summer-activities`) | Đã cập nhật được env public |

> Theo quy tắc: **không tự cài token, không đoán secret/password, không dùng service role
> khi chưa có giá trị đầy đủ**. Vì vậy các bước chạm DB remote được **hoãn** và ghi hướng dẫn
> rõ ràng ở §F để bạn tự xác thực rồi chạy.

## B — Đổi env naming (giữ backward-compat) ✅

Chuẩn tên mới của Supabase:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (khóa `sb_publishable_...`)

Backward-compat: nếu chỉ có tên cũ `NEXT_PUBLIC_SUPABASE_ANON_KEY` thì vẫn được đọc.

| File | Thay đổi |
| --- | --- |
| `src/lib/env.ts` | `supabasePublishableKey = PUBLISHABLE_KEY ?? ANON_KEY ?? ""`; cập nhật `hasSupabaseEnv`/`assertSupabaseEnv` |
| `src/lib/supabase/client.ts` | dùng `env.supabasePublishableKey` |
| `src/lib/supabase/server.ts` | dùng `env.supabasePublishableKey` |
| `src/lib/supabase/proxy.ts` | dùng `env.supabasePublishableKey` |
| `.env.example` | thêm `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`; giữ chú thích tên cũ |
| `.github/workflows/ci.yml` | placeholder build đổi sang `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` |
| `src/lib/supabase/README.md`, `docs/security.md` | cập nhật tên biến |

`.env.local` (không commit) đã sẵn giá trị đúng: URL + `sb_publishable_...`.

## C — Vercel env (public) ✅

`vercel env ls` ban đầu: **0** biến. Đã thêm cho **cả 3 môi trường** (production, preview, development):

| Biến | production | preview | development |
| --- | --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | ✅ | ✅ |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | ✅ | ✅ | ✅ |

Chỉ đẩy **giá trị public** (URL + publishable key). **Không** cấu hình `SUPABASE_SERVICE_ROLE_KEY`
vì chưa có giá trị đầy đủ. Env mới có hiệu lực ở **lần deploy kế tiếp** (không auto-redeploy).

## D — Rà soát migration 04B trước khi push (static) ✅ an toàn

| Kiểm tra | Kết quả |
| --- | --- |
| `create table` | 19 |
| `create policy` | 71 |
| `enable row level security` | có (bật cho toàn bộ bảng) |
| `drop table` | 0 |
| `disable row level security` | 0 |
| `using (true)` ở bảng nhạy cảm | 0 (chỉ xuất hiện trong comment) |

Migration idempotent (`drop policy if exists` trước `create policy`, `create ... if not exists`).
**Không có lệnh phá hủy** → an toàn để `db push` khi remote còn trống. `config.toml.project_id`
đã đổi thành project ref thật (`ymtogeacpnlmthjlryrd`) để `supabase link` trỏ đúng project.

## E — Kiểm tra chất lượng ✅

| Bước | Kết quả |
| --- | --- |
| `npm run lint` | ✅ Pass |
| `npm run typecheck` | ✅ Pass |
| `npm run build` | ✅ Pass (mọi route build bình thường) |

## F — ⚠️ Việc còn chờ bạn xác thực (không tự làm được ở prompt này)

Các bước dưới đây chạm DB remote/production, cần **bạn** đăng nhập + mật khẩu DB. Không được
tự tạo token, không đoán password. Sau khi cài Supabase CLI và đăng nhập:

```bash
# 1) Cài CLI (chọn 1): scoop install supabase | winget | binary release
# 2) Đăng nhập (mở trình duyệt, bạn tự xác thực):
supabase login

# 3) Link project remote:
supabase link --project-ref ymtogeacpnlmthjlryrd   # sẽ hỏi DB password

# 4) Nếu remote đã có bảng/dữ liệu quan trọng → DỪNG, kiểm tra trước khi push.
#    Xem trạng thái migration remote:
supabase migration list

# 5) Push migration 04B (KHÔNG chạy seed demo lên production):
supabase db push

# 6) Sinh TypeScript types từ schema remote:
supabase gen types typescript --project-id ymtogeacpnlmthjlryrd > src/lib/database.types.ts
#    rồi trỏ `Database` trong src/lib/types/index.ts sang file này.
```

- **Không** chạy `supabase db reset`/seed trên remote (seed chỉ dành local/dev).
- Sau khi có env mới trên Vercel + code merge, nếu muốn env có hiệu lực production thì **redeploy**.

## G — Tuân thủ quy tắc

- ✅ Không commit `.env.local` / `.vercel/` / `.next/` / `node_modules` / secret (đã gitignore).
- ✅ Không đưa secret vào client; chỉ publishable/URL (public) lên Vercel.
- ✅ Không dùng `SUPABASE_SECRET_KEY`/service role khi chưa có giá trị đầy đủ.
- ✅ Không direct connection (chưa có DB password); không Prisma/ORM.
- ✅ Không `db push`/seed remote khi chưa xác thực; không drop table; không disable RLS.
- ✅ Không sửa UI lớn; không làm Auth/CRUD/OCR/DOCX thật.
