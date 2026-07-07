-- =============================================================================
-- 08B · Vai trò phụ trách Khu phố (ADDITIVE — không phá dữ liệu cũ)
--
-- secretary_neighborhoods.assignment_role: phân biệt vai trò phụ trách của một
--   Bí thư/Chi Đoàn tại một Khu phố:
--     'PRIMARY'      = Phụ trách chính   (tối đa 1 người/Khu phố)
--     'COORDINATING' = Phụ trách chung / phối hợp (không giới hạn)
--   Đây là METADATA phân công — KHÔNG phải role auth mới. Cả hai vẫn là SECRETARY.
--
-- Ràng buộc "tối đa 1 Phụ trách chính / Khu phố" bằng partial unique index.
-- Không thêm/nới policy RLS: sn_insert/sn_update đã chỉ cho is_admin() ghi;
-- sn_select đã cho Admin + chính chủ đọc. Cột mới nằm trong các policy sẵn có.
--
-- KHÔNG drop bảng/cột. KHÔNG disable RLS. KHÔNG dùng using(true). Idempotent.
-- =============================================================================

alter table public.secretary_neighborhoods
  add column if not exists assignment_role text not null default 'COORDINATING'
  check (assignment_role in ('PRIMARY', 'COORDINATING'));

-- Tối đa 1 Phụ trách chính cho mỗi Khu phố.
create unique index if not exists uq_snb_one_primary_per_neighborhood
  on public.secretary_neighborhoods (neighborhood_id)
  where assignment_role = 'PRIMARY';
