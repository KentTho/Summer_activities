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

## Sau trích xuất (giữ nguyên staging)
- [ ] Sửa dòng → "Lưu & duyệt" (`reviewed=true`).
- [ ] "Xác nhận & tạo N học sinh" chỉ tạo từ dòng **đã duyệt, có Họ tên**; gán Khu phố theo lô.
- [ ] Kiểm `students`: đúng số lượng, không có dòng chưa duyệt lọt vào.

## Bảo mật/log
- [ ] Log server: chỉ số lượng/mime/size — **không** ảnh/base64/SĐT/họ tên/key.
- [ ] Audit có sự kiện `AI_IMPORT` (số dòng), không PII.
