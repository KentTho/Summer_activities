# AI Image Import (Gemini Vision)

> **Prompt 09B**: thay thế hoàn toàn OCR.space bằng **Gemini Vision**. Server-only.
> Thay cho tài liệu `ocr-import.md`/`ocr-production-setup.md` cũ.

## 1. Vì sao bỏ OCR.space
- OCR.space chỉ trả **text thô** → phải tự parse thành dòng học sinh (dễ sai, khó bảo trì).
- Giới hạn free ~1MB/tệp; chất lượng tiếng Việt/diacritics không ổn định.
- Gemini Vision đọc **cấu trúc** (họ tên / ngày sinh / SĐT) và trả **JSON** trực tiếp → ít code parse,
  chất lượng tốt hơn cho ảnh danh sách.

## 2. Luồng (KHÔNG đổi nguyên tắc staging)
Ảnh → **Gemini (server-side)** → dòng NHÁP (`reviewed=false`, `source=GEMINI`) trong `import_batch_rows`
→ Bí thư/Chi Đoàn **kiểm tra/sửa tay** → **Xác nhận** thì mới tạo `students`.
**KHÔNG auto-import.** AI là gợi ý, không phải nguồn sự thật.

## 3. Cấu hình (env — server-only, KHÔNG `NEXT_PUBLIC_`)
| Biến | Mặc định | Ghi chú |
| --- | --- | --- |
| `GEMINI_API_KEY` | — | **Bắt buộc để bật AI.** Lấy tại https://aistudio.google.com/apikey |
| `GEMINI_MODEL` | `gemini-2.5-flash` | Model Vision nhanh/rẻ. |
| `GEMINI_API_BASE_URL` | `https://generativelanguage.googleapis.com` | Endpoint công khai (không phải secret). |
| `AI_IMPORT_MAX_FILE_MB` | `4` | Giới hạn kích thước ảnh. |
| `AI_IMPORT_ENABLED` | `true` | Đặt `false` để tắt AI (nhập tay vẫn chạy). |

**Quota:** Gemini free tier CÓ hạn mức (RPM/ngày), **không đảm bảo vô hạn**. Lỗi 429 → báo người dùng
thử lại sau; nhập tay vẫn hoạt động.

## 4. Cấu hình trên Vercel (thủ công — không tự thêm khi user chưa cấp)
1. Vercel → Project → Settings → Environment Variables.
2. Thêm `GEMINI_API_KEY` = `<khóa của bạn>` cho **Production** (+ Preview nếu cần). KHÔNG `NEXT_PUBLIC_`.
3. (Tùy chọn) `GEMINI_MODEL`, `AI_IMPORT_MAX_FILE_MB`, `AI_IMPORT_ENABLED`.
4. Redeploy. Kiểm `/api/health` → `geminiConfigured: true`, `aiImportReady: true`.

## 5. Định dạng & giới hạn
- **Chỉ ảnh**: JPG/PNG/WebP (`ALLOWED_AI_IMPORT_MIME`). **PDF chưa hỗ trợ** → báo người dùng chụp ảnh.
- ≤ `AI_IMPORT_MAX_FILE_MB` (mặc định 4MB).
- Output JSON schema nghiêm ngặt, validate bằng Zod:
  `{ rows: [{ full_name, birth_date(YYYY-MM-DD|null), guardian_phone, confidence(0..1), notes }], warnings: [] }`
- Chuẩn hóa: SĐT VN `+84→0` + bỏ khoảng trắng; ngày `d/m/y → YYYY-MM-DD`; dòng thiếu field quan
  trọng/độ tin cậy thấp → `needs_review=true` (hiện cảnh báo trên UI).

## 6. Bảo mật (bắt buộc)
- Gemini **chỉ gọi server-side**; key **không** ra client, **không** log key/ảnh/base64/PII.
- Fallback duy nhất là **nhập tay** (không giữ OCR.space).
- Mã nguồn: `src/lib/ai-import/{types,gemini,normalize,index}.ts`; action
  `src/app/user/secretary/import/actions.ts#aiExtractRows`; log an toàn qua `lib/monitoring/server-log.ts`.

## 7. Ghi chú kỹ thuật
- Enum `import_batches.source` giữ giá trị `OCR` (nghĩa là "AI đọc ảnh") để **không** đổi schema
  (migration non-additive). Nguồn thật ghi trong `import_batch_rows.raw_data.source = "GEMINI"`.
