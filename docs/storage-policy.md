# Storage Policy — buckets private

> Prompt 09C. Tổng hợp chính sách Storage của dự án. Mọi bucket đều **PRIVATE**
> (không public URL). Thao tác binary bằng **service role** chỉ **sau khi** đã xác thực user/role.

## Buckets
| Bucket | Nội dung | Public | Whitelist | Tạo |
| --- | --- | --- | --- | --- |
| `report-templates` | Mẫu DOCX (biểu mẫu trống) | ❌ private | `.docx` | 08C, runtime (service role) |
| `ai-import-uploads` | Ảnh gốc AI import (đối chiếu) | ❌ private | image/jpeg,png,webp | 09C, runtime (service role) |

## Nguyên tắc
- **Không public URL.** Không tạo signed URL trả về client cho dữ liệu nhạy cảm; nếu cần tải, đi qua
  **route server có xác thực** rồi stream (như `admin/templates/[id]/download`).
- **Service role chỉ ở server**, chỉ dùng cho thao tác Storage (create bucket/upload/download) **sau** khi
  action đã xác thực user/role. Không bao giờ ra client.
- **Metadata** (`uploaded_documents`) ghi qua **RLS** bằng client đăng nhập (không service role):
  `doc_select` = `is_admin() or uploaded_by = current_profile_id()` → user chỉ thấy tệp của mình.
- **Path an toàn:** chứa UUID ngẫu nhiên, không đoán được. Ảnh AI: `<profileId>/<date>/<batchId>/<uuid>.<ext>`.
  **Không log path** (chứa profile id) — chỉ log mã lô/tài liệu (uuid) + kích thước.
- **Whitelist mime + size** ở cả app (`checkAiImportFile`/`checkTemplateUploadFile`) lẫn bucket config.
- **Không lưu** tệp khi vượt type/size (validate trước upload).

## Liên kết dữ liệu
- `uploaded_documents.import_batch_id` (09C, nullable) gắn ảnh gốc ↔ lô import để đối chiếu.
- Xóa lô/tài liệu: FK `on delete set null`/`cascade` phù hợp; không hard-delete lịch sử ngoài ý muốn.

## Chưa làm (backlog)
- Vòng đời/xóa ảnh cũ theo hạn (retention) + audit tải ảnh.
- Route xác thực để Admin/Bí thư xem lại ảnh gốc (hiện chỉ liệt kê metadata, chưa tải về ở UI).
