# Xuất báo cáo DOCX

> Cập nhật ở Prompt 03B; **hiện thực ở Prompt 08C**. Tương ứng Phase 10.
> **Trạng thái:** ĐÃ CÓ export DOCX thật (MVP) — render server-side bằng bộ ghi ZIP/OOXML
> zero-dependency (`src/lib/docx/`). Mẫu `.docx` upload vào Storage **private** (`report-templates`).
>
> **Đã làm (08C):** xuất DS học sinh, điểm danh theo buổi (Bí thư/Chi Đoàn), tổng hợp hệ thống (Admin)
> — RLS scope + audit `EXPORT_DOCX`; upload/tải mẫu `.docx` (chặn `.docm`/macro: đuôi+mime+magic bytes+
> quét `vbaProject`). **Chưa làm:** đổ dữ liệu vào **placeholder** của mẫu upload (mục 2 dưới) — hiện
> export dùng bộ sinh riêng, mẫu upload là tệp tham chiếu.

## 1. Mục tiêu

Xuất báo cáo (danh sách điểm danh, tổng hợp nghỉ có/không phép, báo cáo buổi sinh hoạt)
ra **DOCX** theo **template do Admin quản lý**, phục vụ in ấn/nộp cấp trên.

## 2. Mô hình template

- Admin tải lên **template DOCX** chứa placeholder (vd `{{ten_khu_pho}}`,
  `{{danh_sach}}`, `{{ngay}}`).
- Template lưu ở bucket riêng, **không public** (`DOCX_TEMPLATE_BUCKET`), phát qua signed URL.
- Render = đổ dữ liệu (đã kiểm quyền theo Khu phố) vào placeholder → sinh file DOCX.

## 3. Luồng export

1. Người dùng chọn phạm vi báo cáo (buổi/khoảng ngày/Khu phố) — trong quyền của mình.
2. Server **truy vấn dữ liệu qua RLS** (không vượt phạm vi Khu phố).
3. Render template → DOCX tạm → phát cho người dùng qua **signed URL ngắn hạn**.
4. Ghi **audit log** (ai/khi nào/template nào/phạm vi dữ liệu).

## 4. Vị trí trong mã nguồn

- Module: `modules/exports/{domain,application,infrastructure}` — hiện là placeholder.
- Application: interface `ReportRenderer` (đổi được thư viện render).
- Infrastructure: adapter thư viện DOCX + kho template.

## 5. Bảo mật

- Render **server-side**; không lộ template/dữ liệu thô ra client.
- Chỉ nhận template `.docx`; **chặn `.docm`/macro** (`lib/security`), kiểm mime+ext+size+hash.
- Quyền đổi/tải template: chỉ Admin; mọi thao tác template ghi audit.
- Chưa chốt thư viện render (giữ nhẹ — không thêm package nặng cho tới Phase 7).

## 6. Chưa làm trong Prompt 03B

Upload template · engine render · sinh file DOCX · signed URL · UI chọn báo cáo.
