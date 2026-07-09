# Khôi phục truy cập Admin (break-glass) — 09F

> Admin gốc **không** dùng luồng "Quên mật khẩu" công khai (đó là cho Bí thư/Phụ huynh). Khôi phục Admin
> đi qua **quy trình quản trị trên máy chủ** (service role). **Không thể xem mật khẩu cũ** (đã hash) —
> chỉ **đặt lại** mật khẩu mới.

## Vì sao Admin không đăng nhập được? (chẩn đoán 09F)
Chạy chẩn đoán (không đổi gì):
```bash
node --env-file=.env.local scripts/recover-admin-account.mjs
# hoặc: npm run recover:admin   (cần tự nạp env)
```
Script in: auth user có/không · `email_confirmed` · `must_change_password` · profile `role`/`active` và
**chẩn đoán nguyên nhân**:
- thiếu hồ sơ ADMIN → login bị đăng xuất ngay;
- role không phải ADMIN / `active=false` → bị chặn;
- `must_change_password=true` → đăng nhập xong bị ép vào `/change-password`;
- không thấy vấn đề rõ ràng → **nhiều khả năng sai mật khẩu** → đặt lại (bên dưới).

## Đặt lại mật khẩu Admin
Set env runtime (KHÔNG commit, KHÔNG in giá trị):
```bash
ADMIN_RECOVERY_IDENTIFIER=Admin \
ADMIN_RECOVERY_PASSWORD='<mật-khẩu-mới-của-bạn>' \
ADMIN_RECOVERY_FORCE_CHANGE=false \
node --env-file=.env.local scripts/recover-admin-account.mjs
```
- `ADMIN_RECOVERY_PASSWORD` **bắt buộc** để đổi (không set ⇒ chỉ chẩn đoán). **Không** hardcode vào source.
- `ADMIN_RECOVERY_FORCE_CHANGE=false` (mặc định): đăng nhập **thẳng** vào `/admin`.
  Đặt `true` nếu muốn ép Admin đổi mật khẩu lần đầu (`/change-password`).
- Script đảm bảo `role=ADMIN`, `active=true`, `email_confirm=true`. **Không in mật khẩu.**

## An toàn
- Chỉ chạy **local/máy chủ** với `SUPABASE_SERVICE_ROLE_KEY` (bỏ RLS). **Không** import ở client.
- Không log mật khẩu/secret. Không lưu mật khẩu vào repo/report.
- Sau khi đặt lại, đăng nhập cổng **Quản trị** (`/admin/login`) bằng mật khẩu vừa đặt.

## Liên quan
- Luồng người dùng (Bí thư/Phụ huynh): [`password-reset-requests.md`](./password-reset-requests.md).
- Admin login đã bỏ link "Quên mật khẩu?" công khai; thay bằng chỉ dẫn khôi phục trên máy chủ.
