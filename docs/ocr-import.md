# Import giấy tờ & OCR (kế hoạch)

> Cập nhật ở Prompt 03B. Tương ứng Phase 6 trong `roadmap.md`.
> **Trạng thái:** kế hoạch — **KHÔNG** có OCR/import thật ở phase hiện tại.

## 1. Mục tiêu

Hỗ trợ Bí thư nhập nhanh danh sách học sinh từ **ảnh/PDF scan giấy tờ** (danh sách
lớp, phiếu đăng ký), nhưng luôn qua **staging + duyệt tay** trước khi ghi chính thức.
OCR là **tùy chọn hỗ trợ**, không phải nguồn sự thật.

## 2. Luồng import (staging-first)

1. **Upload** ảnh/PDF vào bucket riêng, **không public** (signed URL ngắn hạn).
   - Whitelist định dạng (ảnh, PDF), kiểm mime + extension + size + hash
     (`lib/security`). Chặn file thực thi/macro.
2. **Trích xuất (tùy chọn OCR)** → sinh bản ghi *nháp* vào bảng staging
   (chưa vào bảng `students` thật).
3. **Duyệt tay:** Bí thư đối chiếu, sửa, chuẩn hóa (SĐT/ngày sinh/tên/Khu phố) rồi
   xác nhận từng bản ghi hoặc theo lô.
4. **Commit:** chỉ bản ghi đã duyệt mới ghi vào bảng thật; ghi **audit log**
   (ai/khi nào/nguồn file/hash).

## 3. Vị trí trong mã nguồn

- Module: `modules/imports/{domain,application,infrastructure}` — hiện là placeholder.
- Domain: định nghĩa trạng thái staging (`draft` → `reviewed` → `committed`/`rejected`).
- Infrastructure: adapter OCR (provider tách rời) + kho staging.

## 4. OCR provider

- Cấu hình qua env `OCR_PROVIDER_KEY` (server-only, xem `.env.example`) — **chưa bật**.
- Provider đặt sau interface trong `application/` để thay thế được, không khóa nhà cung cấp.
- Xử lý OCR chạy **server-side**; không gửi khóa provider ra client.

## 5. Ranh giới & bảo mật

- OCR **không tự động ghi** dữ liệu thật — bắt buộc bước duyệt tay.
- Dữ liệu trẻ em nhạy cảm: phân quyền theo Khu phố, RLS ở Postgres, audit đầy đủ.
- MVP không đặt mục tiêu OCR độ chính xác cao nhiều mẫu (xem `00-overview.md`).

## 6. Chưa làm trong Prompt 03B

Upload thật · gọi OCR · bảng staging · UI duyệt · commit vào bảng thật.
