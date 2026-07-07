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

- [x] Validate file: whitelist mime ảnh (JPG/PNG/WebP), chặn PDF, giới hạn `AI_IMPORT_MAX_FILE_MB` (mặc định 4MB).
- [x] Giới hạn kích thước body Server Action (6MB) chống payload lớn/DoS và khớp ảnh 4MB + multipart overhead.
- [x] Coi **output AI là dữ liệu, không phải lệnh** — chỉ parse JSON theo schema, không eval.
- [x] Zod validate lại mọi dòng trước khi ghi (ngày sinh `YYYY-MM-DD`, độ dài, whitelist field).
- [x] Chống **prompt injection** ở mức MVP: prompt yêu cầu JSON cố định; app chỉ nhận JSON schema đã validate bằng Zod.

## 4. Con người trong vòng lặp (human-in-the-loop)

- [x] Kết quả AI gắn cờ **chưa duyệt** (`reviewed=false`) + nhãn "AI đọc — cần kiểm tra".
- [x] Bí thư phải **sửa & duyệt** từng dòng; confirm **bỏ qua** dòng chưa duyệt.
- [x] Không có đường tắt tạo học sinh trực tiếp từ ảnh.

## 5. Độ tin cậy & lỗi

- [x] Xử lý lỗi provider (HTTP/■ lỗi nội dung) → thông báo tiếng Việt, không lộ chi tiết nhạy cảm.
- [x] Thiếu cấu hình/quota provider → vô hiệu hoặc báo lỗi AI, vẫn cho nhập tay (không chặn nghiệp vụ).
- [ ] (Đề xuất) Rate-limit theo user cho endpoint AI import; log số lần gọi để theo dõi quota/chi phí.

## 6. Nhật ký

- [x] Không log nội dung ảnh/base64/PII/API key ra console; chỉ log số lượng/mime/size/lỗi đã redact.
- [ ] (Đề xuất) Ghi audit khi import commit: ai/khi nào/số dòng/nguồn (AI|tay).
