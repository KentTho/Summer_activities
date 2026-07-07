# AI Security Checklist (AI import — chọn lọc)

> Thêm ở **Prompt 06B**; cập nhật **09B** (bỏ OCR.space, dùng **Gemini Vision**).
> Áp dụng cho AI import hiện tại (Gemini). Ngắn gọn, thực thi được. Xem `gemini-ai-import.md`.

## 1. Khóa & bí mật

- [x] API key AI (Gemini) **chỉ ở server** (env, không tiền tố `NEXT_PUBLIC_`).
- [x] Gọi provider **chỉ** từ Server Action / route handler — không từ client.
- [x] Không hardcode key trong mã; không để key thật trong `.env.example` (file commit).
- [ ] (Đề xuất) Xoay key định kỳ; tách key theo môi trường (dev/prod).

## 2. Dữ liệu & quyền riêng tư (dữ liệu trẻ em — nhạy cảm)

- [x] AI **không auto-ghi** vào bảng thật; chỉ tạo `import_batch_rows` (staging).
- [x] Ghi học sinh vẫn qua **RLS theo Khu phố** (chặn cuối ở Postgres).
- [ ] Tối thiểu hóa dữ liệu gửi provider: chỉ ảnh cần đọc; không kèm PII thừa.
- [ ] (Đề xuất) Không lưu ảnh gốc lâu; nếu lưu → bucket private + signed URL + hash + xóa
      theo hạn. Hiện tại **không lưu ảnh** (đọc tại chỗ, chỉ giữ dòng nháp đã duyệt).
- [ ] Rà điều khoản Google Gemini (free tier có quota) về lưu trữ/đào tạo trên dữ liệu gửi lên.

## 3. Đầu vào không tin cậy (untrusted input)

- [x] Validate file: whitelist mime (ảnh/PDF), chặn thực thi/macro, giới hạn 1MB.
- [x] Giới hạn kích thước body Server Action (2MB) chống payload lớn/DoS.
- [x] Coi **text OCR là dữ liệu, không phải lệnh** — parser chỉ trích xuất, không eval.
- [x] Zod validate lại mọi dòng trước khi ghi (ngày sinh `YYYY-MM-DD`, độ dài, whitelist field).
- [ ] (Nếu dùng LLM chuẩn hóa) chống **prompt injection**: tách rõ system/user, không để
      text OCR điều khiển hành vi; chỉ nhận JSON theo schema cố định.

## 4. Con người trong vòng lặp (human-in-the-loop)

- [x] Kết quả OCR gắn cờ **chưa duyệt** (`reviewed=false`) + nhãn "AI đọc — cần kiểm tra".
- [x] Bí thư phải **sửa & duyệt** từng dòng; confirm **bỏ qua** dòng chưa duyệt.
- [x] Không có đường tắt tạo học sinh trực tiếp từ ảnh.

## 5. Độ tin cậy & lỗi

- [x] Xử lý lỗi provider (HTTP/■ lỗi nội dung) → thông báo tiếng Việt, không lộ chi tiết nhạy cảm.
- [x] Thiếu cấu hình → vô hiệu OCR, vẫn cho nhập tay (không chặn nghiệp vụ).
- [ ] (Đề xuất) Rate-limit theo user cho endpoint OCR; log số lần gọi để theo dõi chi phí.

## 6. Nhật ký

- [x] Không log nội dung ảnh/PII/text OCR ra console; chỉ log tên provider + lỗi tối thiểu.
- [ ] (Đề xuất) Ghi audit khi import commit: ai/khi nào/số dòng/nguồn (OCR|tay).
