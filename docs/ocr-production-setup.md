# OCR Production Setup

> Prompt 09A. Cấu hình OCR cho môi trường production. Bổ trợ `ocr-import.md`.

## Biến môi trường (Vercel — Environment Variables)
| Biến | Bắt buộc | Ghi chú |
| --- | --- | --- |
| `OCR_SPACE_API_KEY` | Có (nếu muốn OCR chạy) | **Server-only** — TUYỆT ĐỐI không `NEXT_PUBLIC_`. |
| `OCR_PROVIDER` | Nên đặt | `ocrspace` (mặc định). |
| `OCR_SPACE_API_URL` | Không | Mặc định `https://api.ocr.space/parse/image` (endpoint công khai, không phải secret). |
| `OCR_SPACE_LANGUAGE` | Không | Mặc định `vie`. |
| `OCR_SPACE_ENGINE` | Không | Mặc định `1` (diacritics tốt hơn). |

## Hành vi khi thiếu key
- Thiếu `OCR_SPACE_API_KEY` ở production → `hasOcrConfigured()` = false:
  - Nút "OCR" **disabled** (không gọi API), nhưng **nhập tay vẫn hoạt động bình thường**.
  - `/api/health` trả `ocrConfigured: false` (không lộ giá trị key).
- KHÔNG hardcode key trong code/git. Chỉ đặt qua env server của Vercel.

## Thêm key trên Vercel (thủ công — không tự thêm khi user chưa cấp)
1. Vercel → Project → Settings → Environment Variables.
2. Thêm `OCR_SPACE_API_KEY` = `<khóa của bạn>` cho **Production** (và Preview nếu cần).
3. Đặt `OCR_PROVIDER=ocrspace`.
4. Redeploy để áp env mới. Kiểm `/api/health` → `ocrConfigured: true`.

## Bảo mật
- Key chỉ đọc server-side (`lib/env.ts`), dùng trong Server Action `ocrExtractRows`.
- Giới hạn ảnh/PDF ≤ 1MB trước khi gọi API (fail-fast, chống DoS).
- OCR không lưu ảnh gốc ở bản hiện tại (lưu ảnh private + audit → backlog).
