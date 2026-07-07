-- =============================================================================
-- 09C · Thêm giá trị enum 'AI' vào import_source (ADDITIVE)
--
-- Import ảnh nay dùng Gemini → nguồn 'AI'. GIỮ NGUYÊN 'OCR' để không phá dữ liệu
-- lịch sử (các lô cũ được đánh 'OCR'). KHÔNG đổi/xóa giá trị cũ.
--
-- Lưu ý Postgres: chỉ THÊM value (không dùng value mới trong cùng migration) để
-- an toàn với transaction. `IF NOT EXISTS` → idempotent, chạy lại không lỗi.
-- KHÔNG drop/disable RLS. KHÔNG reset DB.
-- =============================================================================

alter type public.import_source add value if not exists 'AI';
