# Network Security Notes (HTTPS/SSH) — Vận hành

> Ghi chú vận hành/bảo mật (áp dụng từ tài liệu HTTPS/SSH người dùng cung cấp). **Không** biến thành
> feature UI trong app — chỉ là chuẩn vận hành hạ tầng.

## HTTPS / TLS
- **Bắt buộc HTTPS** cho production (Vercel cấp TLS tự động). Không phục vụ HTTP thuần.
- **Không truyền token/secret qua URL/query string** (dễ lộ qua log/referrer). Dùng header/cookie.
- Cookie phiên **HttpOnly + Secure + SameSite** (Supabase SSR cookie `sb-<ref>-auth-token`).
- HSTS do nền tảng (Vercel) xử lý; không tự hạ cấp.

## Xác thực & session
- JWT/session chỉ ở server + cookie HttpOnly; **không** đưa service role/secret ra client.
- RLS deny-by-default là lớp chặn cuối ở Postgres — không dựa vào chỉ UI/route guard.

## SSH / Khóa quản trị
- SSH/key chỉ dùng cho **quản trị hạ tầng** (nếu có máy chủ riêng) — không liên quan runtime app.
- Không commit private key/`.pem`/`.env`. Khóa lưu ở trình quản lý bí mật, xoay khi nghi lộ.

## Secret & CI
- Secret production ở **Vercel Env** (server-only) + **GitHub Actions Secrets** cho CI/smoke.
- `SUPABASE_SERVICE_ROLE_KEY` server-only; nếu từng lộ → **rotate** (Supabase → API → reset).
- Không log secret/token/cookie/PII (họ tên, SĐT, ảnh, chữ ký, base64) — logger đã redact.

## Dữ liệu học sinh
- **Không public bucket** chứa ảnh giấy tờ/chữ ký học sinh. Truy cập qua route xác thực + audit.
- Chữ ký học sinh là dữ liệu nhạy cảm: 10B chỉ lưu **metadata** (`signature_present/note`), không lưu ảnh chữ ký.

> Infographic HTTPS/SSH chỉ dùng nội bộ làm tài liệu; **không** nhúng vào giao diện ứng dụng.
