# AI Import — Test Plan (Gemini)

> Prompt 09B. Checklist kiểm thử AI import. Bổ trợ `sdlc-debugging-test-plan.md`.

## Điều kiện
- Đăng nhập vai trò **Bí thư/Chi Đoàn** (hoặc Admin) đã được gán Khu phố.
- Tạo/mở một lô import nháp.

## Trường hợp bắt buộc
- [ ] **Không có key / `AI_IMPORT_ENABLED=false`**: nút "AI đọc ảnh" **disabled** + thông báo; **nhập tay
      vẫn chạy**; `/api/health` `aiImportReady:false`.
- [ ] **Ảnh rõ, danh sách chuẩn**: AI trả nhiều dòng nháp `reviewed=false`, có confidence; **không**
      tạo học sinh cho tới khi bấm "Xác nhận".
- [ ] **Ảnh mờ/nghiêng/không đọc được**: trả 0 dòng + cảnh báo thân thiện (không crash).
- [ ] **Thiếu SĐT / thiếu ngày sinh**: dòng bị đánh dấu `needs_review=true` (hiện "nên kiểm tra kỹ").
- [ ] **Ngày d/m/y**: chuẩn hóa về `YYYY-MM-DD`; chỉ có năm → `birth_date=null`.
- [ ] **SĐT +84…**: chuẩn hóa về `0…`, bỏ khoảng trắng.
- [ ] **PDF**: bị chặn với thông báo "chưa hỗ trợ PDF, hãy chụp ảnh".
- [ ] **Ảnh > giới hạn MB**: bị chặn với thông báo giảm dung lượng.
- [ ] **Quota/timeout (429/abort)**: thông báo thân thiện; nhập tay vẫn dùng được; **không** crash trang.

## Rate-limit + private storage (09C)
- [ ] **Vượt hạn ngày** (`AI_IMPORT_DAILY_LIMIT`): nút AI disabled + báo "Đã đạt giới hạn AI hôm nay…";
      **không** gọi Gemini, **không** upload ảnh; nhập tay vẫn chạy. UI hiện "lượt còn lại".
- [ ] **Trong hạn**: mỗi lần gọi tăng 1 lượt (atomic); UI cập nhật lượt còn lại.
- [ ] **Gọi trực tiếp Server Action sai quyền/batch**: role không phải Bí thư/Admin hoặc batch không thuộc người gọi
      bị từ chối **trước** rate-limit/upload/Gemini.
- [ ] **Ảnh gốc lưu private**: sau khi AI đọc, mục "Ảnh gốc đã lưu (riêng tư)" hiện tệp; `uploaded_documents`
      có dòng với `import_batch_id`, `bucket=ai-import-uploads`, `sha256`. **Không** public URL.
- [ ] **Gemini fail sau upload**: ảnh vẫn được lưu (đối chiếu), user nhập tay được.
- [ ] **RLS**: user chỉ thấy ảnh/lượt của mình; Admin thấy tất cả.

## Sau trích xuất (giữ nguyên staging)
- [ ] Sửa dòng → "Lưu & duyệt" (`reviewed=true`).
- [ ] "Xác nhận & tạo N học sinh" chỉ tạo từ dòng **đã duyệt, có Họ tên**; gán Khu phố theo lô.
- [ ] Kiểm `students`: đúng số lượng, không có dòng chưa duyệt lọt vào.

## Xem/tải ảnh gốc + retention + monitoring (09D)
- [ ] **Chưa đăng nhập / PARENT** gọi route ảnh → 403; **không** stream nhị phân.
- [ ] **SECRETARY đúng lô** (chủ lô/Khu phố phụ trách): "Xem ảnh gốc" mở ảnh inline; `?download=1` tải về.
- [ ] **SECRETARY sai lô / ngoài scope**: 404 (không lộ tồn tại); `documentId` không thuộc `batchId` → 404.
- [ ] **ADMIN**: xem được ảnh mọi lô.
- [ ] **Audit**: mỗi lần xem/tải ghi `VIEW_AI_IMPORT_IMAGE`/`DOWNLOAD_AI_IMPORT_IMAGE` (id lô/tài liệu, không PII/path).
- [ ] **UI**: chỉ hiện "Ảnh N" + size + ngày + nút xem; **không** path/URL công khai.
- [ ] **Retention dry-run**: `npm run cleanup:ai-import-images -- --days=90` in count/size/bucket, **không** xóa.
- [ ] **Retention thiếu service role**: báo `BLOCKED`, không crash.
- [ ] **Health**: `/api/health` phase `09d-…` + cờ `aiImportImageViewerReady/aiImportRetentionReady/monitoringReady`.
- [ ] **`npm run healthcheck`**: PASS khi status=ok & phase khớp; FAIL (exit≠0) khi lệch.

## Bảo mật/log
- [ ] Log server: chỉ số lượng/mime/size — **không** ảnh/base64/SĐT/họ tên/key.
- [ ] Audit có sự kiện `AI_IMPORT` (số dòng), không PII.
- [ ] Dòng AI mới: `raw_data.source = "AI"` (không còn `"GEMINI"`).
