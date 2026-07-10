-- Prompt 10B — Bổ sung trường học sinh cho AI import mở rộng (ADDITIVE, idempotent).
-- CHỈ THÊM cột. KHÔNG drop, KHÔNG đổi/không disable RLS, KHÔNG using(true).
-- Policy students hiện có áp cho toàn bộ cột nên không cần policy mới.
--
-- Nghiệp vụ: AI đọc ảnh có thể trích năm sinh (birth_year đã có), giới tính, và
-- ghi nhận CÓ chữ ký hay không. Chữ ký là dữ liệu nhạy cảm → 10B CHỈ lưu METADATA
-- (có/không + ghi chú), KHÔNG lưu ảnh/crop chữ ký (để prompt sau nếu cần, private storage).

-- Giới tính: chỉ nhận tập giá trị rõ ràng; NULL nếu ảnh không ghi (KHÔNG suy đoán từ tên).
alter table public.students
  add column if not exists gender text
    check (gender is null or gender in ('MALE', 'FEMALE', 'OTHER', 'UNKNOWN'));

-- Có chữ ký trong giấy tờ hay không (metadata; NULL = chưa rõ).
alter table public.students add column if not exists signature_present boolean;

-- Ghi chú về chữ ký (vd "ký ở cột 5", "mờ") — KHÔNG chứa ảnh/base64.
alter table public.students add column if not exists signature_note text;
