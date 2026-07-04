# supabase/

Cấu hình Supabase (Postgres + Auth + Storage). **Phase 1 chỉ là mẫu** — chưa kết nối DB thật.

| Mục | Trạng thái |
| --- | --- |
| `config.toml` | Mẫu cho `supabase start` / `supabase link` |
| `migrations/` | Trống — schema + RLS thêm ở **Phase 2** |
| `seed.sql` | Placeholder — seed Khu phố mẫu + Admin ở Phase 2 |

## Bắt đầu local (khi cần)

```bash
npm i -g supabase        # hoặc dùng npx supabase
supabase start           # chạy Postgres + Studio local
supabase db reset        # áp migrations + seed
```

## Nguyên tắc bảo mật (spec §7)

- RLS **bật trên mọi bảng nghiệp vụ**; viết policy qua helper function (`is_admin`,
  `can_access_neighborhood`, `can_access_session`, `can_access_student`).
- Bucket Storage **không public**; phát file qua signed URL ngắn hạn.
- Không cho tự đăng ký (`enable_signup = false`); tài khoản do Admin tạo.
