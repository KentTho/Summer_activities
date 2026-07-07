# Import giấy tờ (LỊCH SỬ — OCR.space)

> ⚠️ **ĐÃ THAY THẾ ở Prompt 09B**: OCR.space bị gỡ bỏ hoàn toàn; import ảnh nay dùng
> **Gemini Vision**. Tài liệu vận hành hiện hành: **`gemini-ai-import.md`**.
> File này giữ lại làm **lịch sử** (mô tả bản OCR.space cũ ở 06B) — không còn hiệu lực.

## 1. Mục tiêu

Hỗ trợ Bí thư nhập nhanh danh sách học sinh từ **ảnh/PDF scan giấy tờ** (danh sách
lớp, phiếu đăng ký). OCR chỉ là **gợi ý hỗ trợ**, KHÔNG phải nguồn sự thật: mọi kết
quả đều qua **staging + duyệt tay** trước khi ghi vào bảng `students`.

## 2. Luồng import (đã triển khai — staging-first, không auto-import)

```
Tạo lô (import_batches, DRAFT)
   │
   ├── (A) OCR ảnh/PDF  ──► server-side OCR ──► parser ──► import_batch_rows (reviewed=FALSE)
   │                                                         "AI đọc — cần kiểm tra"
   ├── (B) Nhập tay     ──────────────────────► import_batch_rows (reviewed=TRUE)
   │
   ▼
Kiểm tra & sửa từng dòng ("Lưu & duyệt" → reviewed=TRUE)
   │
   ▼
Xác nhận lô  ──► CHỈ dòng reviewed=TRUE + có Họ tên ──► tạo students (Khu phố theo lô)
                 → đánh dấu created_student_id; hết dòng chờ → lô COMMITTED
```

Điểm mấu chốt (khớp guardrails Prompt 06B):

- **OCR chạy server-side** (Server Action `ocrExtractRows`). API key **không bao giờ**
  ở client.
- Ảnh/scan **không auto-import** thẳng vào `students`.
- Kết quả OCR **chỉ tạo `import_batch_rows`** (`reviewed=false`).
- Bí thư **kiểm tra/sửa tay**; "Lưu & duyệt" đặt `reviewed=true`.
- **Chỉ khi confirm** mới tạo học sinh; confirm **bỏ qua dòng chưa duyệt**
  (enforce "sửa tay trước khi confirm").

## 3. Vị trí trong mã nguồn

| Thành phần | File |
| --- | --- |
| Interface + kiểu OCR | `src/lib/ocr/types.ts` |
| Adapter OCR.space (server) | `src/lib/ocr/ocrspace.ts` |
| Parser text → dòng ứng viên (VN) | `src/lib/ocr/parse.ts` |
| Factory + `extractStudentsFromImage()` | `src/lib/ocr/index.ts` |
| Server Actions (ocr/update/confirm) | `src/app/user/secretary/import/actions.ts` |
| UI tải ảnh OCR | `src/app/user/secretary/import/[batchId]/OcrUploadForm.tsx` |
| UI sửa dòng (duyệt) | `src/app/user/secretary/import/[batchId]/EditableRow.tsx` |
| Validate file upload | `src/lib/security/index.ts` (`checkOcrUploadFile`) |
| Cấu hình env | `src/lib/env.ts` (`hasOcrConfigured`) |

## 4. OCR provider (ưu tiên free/low-cost)

- **Primary: OCR.space Free OCR API** — `OCR_PROVIDER=ocrspace`, key ở
  `OCR_SPACE_API_KEY` (server-only). Giới hạn free ~1MB/tệp → app chặn ≤ 1MB.
  Ngôn ngữ mặc định `vie` (giữ dấu), engine `1`.
- **Optional sau:** Google Cloud Vision OCR (độ chính xác cao hơn), Gemini API để
  chuẩn hóa text → JSON. Đặt sau cùng interface `OcrProvider` để thay thế được,
  không khóa nhà cung cấp.
- **Thiếu key:** UI/flow vẫn chạy; nút OCR bị vô hiệu + báo "OCR chưa cấu hình".
  KHÔNG gọi API thật.

## 5. Parser (best-effort, tiếng Việt)

`parseOcrText()` tách từng dòng:
- **SĐT:** `0xxxxxxxxx` / `+84…` → chuẩn hóa (bỏ dấu cách, `+84`→`0`).
- **Ngày sinh:** `d/m/yyyy`, `d-m-yy`, `d.m.yyyy` → `YYYY-MM-DD` (validate tháng/ngày).
- **Tên:** phần còn lại sau khi bỏ SĐT/ngày, bỏ STT đầu dòng ("1.", "2)"), gộp
  khoảng trắng. Bỏ dòng tiêu đề ("STT", "Họ tên", "Danh sách"…).
Chỉ nhận dòng có **tên hợp lệ** hoặc **SĐT**. Đây chỉ là gợi ý — Bí thư sửa tay.

## 6. Ranh giới & bảo mật

- File: whitelist mime (JPG/PNG/WebP/PDF), chặn thực thi/macro, giới hạn 1MB
  (`checkOcrUploadFile`). Body Server Action nới 2MB (`next.config.ts`).
- OCR **không tự động ghi** dữ liệu thật — bắt buộc duyệt tay.
- Dữ liệu trẻ em nhạy cảm: phân quyền theo Khu phố (RLS Postgres) vẫn là chặn cuối.
- Không log nội dung ảnh/PII ra console; chỉ log tên provider khi cần.
- Xem thêm `docs/ai-security-checklist.md`.

## 7. Chưa làm (để phase sau)

- Lưu ảnh gốc vào bucket riêng + signed URL + hash/audit (hiện chỉ OCR tại chỗ,
  không lưu ảnh).
- Google Vision / Gemini normalization.
- Ghép `import_batch_rows` ↔ bảng `guardians` (hiện denormalize lên `students`).
