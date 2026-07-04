# supabase/

Cấu hình Supabase (Postgres + Auth + Storage) và **schema thật + RLS** (Prompt 04B).

| Mục | Trạng thái |
| --- | --- |
| `config.toml` | Cấu hình `supabase start` / `db reset` / `link`; đã bật `[db.seed]` |
| `migrations/` | **Schema cốt lõi + helper + RLS** (04B) — xem 3 file dưới |
| `seed.sql` | Seed **local/dev** (dữ liệu giả, không auth) — chạy qua `db reset` |
| `tests/rls_smoke.sql` | Smoke test RLS theo vai trò (Admin/Bí thư/Phụ huynh/anon) |

## Migrations (áp theo thứ tự tên file)

1. `20260705010000_core_schema.sql` — extensions, enums, ~19 bảng, index, trigger `updated_at`, grants.
2. `20260705010100_rls_helpers.sql` — helper RBAC (`is_admin`, `can_access_neighborhood`,
   `can_access_student`, `can_access_session`, `is_guardian_of`…) dạng `security definer`.
3. `20260705010200_rls_policies.sql` — **BẬT RLS deny-by-default** + policy theo vai trò.

## Áp dụng (local — khi cần)

```bash
npm i -g supabase          # hoặc dùng npx supabase
supabase start             # Postgres + Studio local (cần Docker)
supabase db reset          # áp migrations + seed.sql
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f supabase/tests/rls_smoke.sql
supabase gen types typescript --local > src/lib/database.types.ts   # sinh types
```

## Áp dụng (remote — cần bạn cung cấp)

Chưa `link` project remote. Để push schema lên Supabase thật:

```bash
supabase login             # (bạn tự đăng nhập — không lưu token trong repo)
supabase link --project-ref <PROJECT_REF>
supabase db push           # áp migrations lên remote
```

> **KHÔNG** chạy `seed.sql` lên production (dữ liệu demo). Seed chỉ cho local/dev/staging.

## Nguyên tắc bảo mật (spec §7)

- RLS **bật trên mọi bảng nghiệp vụ**; policy qua helper `security definer` (tránh đệ quy).
- **Deny-by-default**: không policy = bị chặn; `anon` không có quyền bảng nhạy cảm.
- `audit_logs` **append-only** (không policy update/delete); `system_settings` không xóa được.
- Bucket Storage **không public**; phát file qua signed URL ngắn hạn.
- Không cho tự đăng ký (`enable_signup = false`); tài khoản do Admin tạo.
