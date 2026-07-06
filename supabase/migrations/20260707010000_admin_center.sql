-- =============================================================================
-- 08A · Admin Control Center enablers (ADDITIVE — không phá dữ liệu cũ)
-- 1) profiles.staff_title: chức danh hiển thị cho role SECRETARY ('Bí thư' | 'Chi Đoàn').
--    Dùng CHUNG quyền SECRETARY — KHÔNG tạo role mới.
-- 2) activity_sessions.canceled_at: vòng đời "dừng/hủy buổi" (null = chưa hủy).
-- KHÔNG drop bảng/cột. KHÔNG disable RLS. KHÔNG dùng using(true). Idempotent.
-- =============================================================================

alter table public.profiles
  add column if not exists staff_title text;

alter table public.activity_sessions
  add column if not exists canceled_at timestamptz;
