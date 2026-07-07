# AI Code Security Gate (chống "vibe coding")

> Prompt 09A. Rút gọn nhóm **AI Security / Vibe Coding** thành checklist review cho dự án.
> Bổ trợ `ai-security-checklist.md` (OCR/AI), `engineering-guardrails.md §4`.

## Cổng review trước khi merge code (kể cả code do AI gợi ý)
- [ ] **Không hardcode secret** (key/token/password) trong code hay git. Đọc từ `process.env` (`lib/env.ts`).
      `npm run preflight` quét rò rỉ giá trị secret.
- [ ] **Validate input phía server** bằng Zod; whitelist field (chống mass-assignment).
- [ ] **Kiểm access control**: mỗi read/write mới có RLS phù hợp? route handler tự kiểm vai trò?
- [ ] **Không copy code không hiểu.** Đọc guide đúng phiên bản (Next.js ở `node_modules/next/dist/docs`
      — repo này khác bản thường). Hiểu rồi mới đưa vào.
- [ ] **Không tin "trông có vẻ chạy"**: phải `lint`/`typecheck`/`build` + test hành vi thật.

## Xử lý dữ liệu do AI sinh ra (Gemini import — xem `gemini-ai-import.md`)
- [ ] Output AI là **gợi ý** → qua **duyệt tay** trước khi ghi thật (đã enforce ở import staging).
- [ ] Key AI (Gemini) **chỉ ở server**; KHÔNG log key/ảnh/base64/nội dung nhạy cảm học sinh/phụ huynh.
- [ ] Validate output AI bằng **Zod schema nghiêm ngặt**; strip code fence; chuẩn hóa trước khi lưu nháp.
- [ ] Không để prompt/nội dung người dùng điều khiển hành vi hệ thống (injection) chạm quyền.

## Xử lý tệp do người dùng tải lên (DOCX mẫu)
- [ ] Whitelist đuôi + MIME + **magic bytes**; chặn `.docm`/macro (quét `vbaProject`/`macroEnabled`).
- [ ] Lưu **bucket private**; đọc/ghi server-side; không public URL.
- [ ] Render/merge DOCX **server-side**; escape XML khi chèn dữ liệu vào tài liệu.
