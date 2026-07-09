# AI Image Import (Gemini Vision)

> **Prompt 09B**: thay thế hoàn toàn OCR.space bằng **Gemini Vision**. Server-only.
> Thay cho tài liệu `ocr-import.md`/`ocr-production-setup.md` cũ.

## 1. Vì sao bỏ OCR.space
- OCR.space chỉ trả **text thô** → phải tự parse thành dòng học sinh (dễ sai, khó bảo trì).
- Giới hạn free ~1MB/tệp; chất lượng tiếng Việt/diacritics không ổn định.
- Gemini Vision đọc **cấu trúc** (họ tên / ngày sinh / SĐT) và trả **JSON** trực tiếp → ít code parse,
  chất lượng tốt hơn cho ảnh danh sách.

## 2. Luồng (KHÔNG đổi nguyên tắc staging)
Ảnh → **Gemini (server-side)** → dòng NHÁP (`reviewed=false`, `raw_data.source="AI"`, provider=Gemini) trong `import_batch_rows`
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
| `AI_IMPORT_DAILY_LIMIT` | `50` | **09C**: số lượt AI/người dùng/ngày (bảo vệ quota). |

**Quota:** Gemini free tier CÓ hạn mức (RPM/ngày), **không đảm bảo vô hạn**. Lỗi 429 → báo người dùng
thử lại sau; nhập tay vẫn hoạt động.

## 3b. Rate-limit theo người dùng (09C)
- Mỗi người dùng có hạn **`AI_IMPORT_DAILY_LIMIT`** lượt/ngày. Đếm ở bảng `ai_import_usage`
  (`unique(profile_id, used_on)`); tăng lượt **atomic** qua RPC `consume_ai_import_quota(p_limit)`
  (SECURITY DEFINER, chỉ tác động lượt của chính người gọi). UI hiện "lượt còn lại hôm nay".
- Vượt hạn → **KHÔNG** gọi Gemini, **KHÔNG** upload ảnh; báo "Đã đạt giới hạn AI hôm nay… nhập tay hoặc
  thử lại ngày mai". **Nhập tay vẫn chạy.**
- RLS: user chỉ đọc lượt của mình; Admin đọc tất cả. Không policy ghi cho user (chỉ RPC ghi).

## 3c. Lưu ảnh gốc riêng tư (09C)
- Ảnh gốc lưu ở bucket **PRIVATE** `ai-import-uploads` (không public URL), path
  `<profileId>/<date>/<batchId>/<random>.<ext>`. Metadata vào `uploaded_documents` (bucket/path/mime/
  size/sha256/uploaded_by/**import_batch_id**) qua RLS. Dùng để **đối chiếu khi AI đọc sai**.
- Thứ tự: xác thực role + batch thuộc người gọi → rate-limit → **upload ảnh** → `uploaded_documents` → Gemini.
  Gemini fail sau upload → ảnh vẫn còn để đối chiếu; user nhập tay được. Storage thao tác bằng service role
  **sau** khi xác thực user/role/quyền với lô.

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

## 3d. Xem/tải ảnh gốc + retention + monitoring (09D)
- **Route xem/tải ảnh**: `GET /user/secretary/import/[batchId]/documents/[documentId]` (`?download=1` để tải).
  Xác thực trong route handler: ADMIN tất cả; SECRETARY chỉ ảnh thuộc lô mình có quyền (RLS lô); PARENT chặn.
  Ảnh ràng buộc `import_batch_id`+bucket; stream inline/attachment; audit `VIEW/DOWNLOAD_AI_IMPORT_IMAGE`.
  UI lô có nút **"Xem ảnh gốc"** (không lộ path/URL). Chi tiết: [`storage-policy.md`](./storage-policy.md).
- **Retention**: `npm run cleanup:ai-import-images -- --days=90` (dry-run) → thêm `--apply` mới xóa.
- **Monitoring**: `npm run healthcheck` gọi `/api/health` production; xem [`monitoring-uptime.md`](./monitoring-uptime.md).

## 7. Ghi chú kỹ thuật
- **09C**: enum `import_source` đã thêm giá trị **`AI`** (migration additive) → lô AI đánh `source='AI'`.
  Giá trị `OCR` cũ **giữ lại** cho dữ liệu lịch sử (không đổi/xóa).
- **09D**: dòng AI ghi `import_batch_rows.raw_data.source = "AI"` (nguồn **nghiệp vụ**), đồng bộ với
  `import_batches.source='AI'`. **`GEMINI` là provider kỹ thuật**, **`AI` là nguồn nghiệp vụ** — không
  mass-update dữ liệu cũ.
- Mã nguồn 09C: `supabase/migrations/20260708010000_*`, `..._20260708010100_*`;
  `src/lib/storage/ai-import.ts`, `src/lib/data/ai-import-usage.ts`; RPC `consume_ai_import_quota` /
  `my_ai_import_usage_today`.
