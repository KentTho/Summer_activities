# Production Env Checklist (Vercel)

Kiểm trước/khi deploy production. **KHÔNG in giá trị secret** ra log/report/PR.

## Biến bắt buộc (Vercel → Settings → Environment Variables → Production)
| Biến | Loại | Bắt buộc | Hệ quả nếu thiếu |
| --- | --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Public | ✅ | App không kết nối Supabase |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Public | ✅ | Client không auth được |
| `SUPABASE_SERVICE_ROLE_KEY` | **Server-only (Secret)** | ✅ | **Route Storage private trả 503** (xem/tải ảnh AI, tải mẫu DOCX). Xác thực/RLS vẫn đúng nhưng không đọc được nhị phân |
| `GEMINI_API_KEY` | Server-only (Secret) | ⛅ tùy chọn | Nút AI import tắt; **nhập tay vẫn chạy** |
| `AI_IMPORT_DAILY_LIMIT` | Server | tùy chọn | Mặc định 50 |

## Cách kiểm (an toàn, không lộ giá trị)
```bash
vercel env ls            # chỉ liệt kê TÊN biến + môi trường, không in giá trị
curl -s https://<prod>/api/health   # xem cờ serviceRoleConfigured
```
- `/api/health.serviceRoleConfigured === true` ⇒ server production đã có service role key.
- Nếu `false`: route ảnh AI trả **503 “Dịch vụ lưu trữ chưa được cấu hình…”** (không phải 500 trần).

## Khi thiếu `SUPABASE_SERVICE_ROLE_KEY` (OPERATION REQUIRED)
1. Vercel Dashboard → Project → **Settings → Environment Variables**.
2. **Add** `SUPABASE_SERVICE_ROLE_KEY` cho **Production** (dán giá trị từ Supabase → Project Settings →
   API → service_role; **không** commit/không in ra đâu khác).
3. **Redeploy** production.
4. Xác minh: `curl /api/health` → `serviceRoleConfigured: true`; rồi
   `E2E_BASE_URL=https://<prod> npm run smoke:ai-image-http` → ADMIN/SECRETARY đúng scope **200**.

## Xoay khóa (nếu key từng bị lộ)
- Supabase → Project Settings → API → **Reset service_role key** → cập nhật lại trên Vercel + `.env.local`.
- Không dùng lại key cũ; kiểm audit truy cập bất thường.
