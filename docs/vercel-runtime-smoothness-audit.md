# Vercel Runtime Smoothness Audit — 10B

Rà soát các điểm ảnh hưởng độ mượt/ổn định khi chạy trên Vercel (serverless). ✅ ổn · ⚠️ theo dõi · 🔴 cần sửa.

| Hạng mục | Hiện trạng | Đánh giá | Ghi chú / Hành động |
|---|---|---|---|
| Server Actions body size | AI import chặn ảnh ≤ `AI_IMPORT_MAX_FILE_MB` (mặc định 4MB) + mime whitelist | ✅ | Giữ giới hạn để tránh timeout/parse nặng |
| Route service role (ảnh AI) | Trả **503 thân thiện** khi thiếu key (09H) + try/catch storage | ✅ | Không 500 trần; log redact |
| Storage private | Bucket `ai-import-uploads`/`report-templates` private, đọc qua route sau xác thực | ✅ | Không public URL |
| DOCX download | Route server đọc binary sau requireAdmin/quyền | ✅ | attachment, không public |
| Password reset flow | RPC trung lập chống spam; Admin resolve reset tạm | ✅ | — |
| Healthcheck phase | `check-production-health.mjs` default + `EXPECT_PHASE` (09I) | ✅ | Đồng bộ health route khi lên phase |
| CI smoke | `e2e-smoke.yml` có điều kiện + fail-fast secrets | ✅ | Không lộ secret |
| Retention workflow | dry-run mặc định, apply sau cờ repo | ✅ | — |
| Notification counts / badge | `countMyUnreadNotifications` head-count mỗi render (09I) | ⚠️ | Nhẹ; nếu tải cao cân nhắc cache ngắn |
| AI import quota | `consume_ai_import_quota` atomic RPC | ✅ | Bảo vệ quota Gemini |
| force-dynamic routes | Các trang RLS dùng `dynamic = "force-dynamic"` | ✅ | Đúng cho dữ liệu theo phiên |
| Edge/runtime | Route handlers dùng Node runtime (service role SDK) | ✅ | Không đặt service role ở Edge |
| Migration | Additive-only, đã áp remote (10B: gender/signature + RPC) | ✅ | Không drop/disable RLS |

## Phát hiện 10B
- **Không có lỗi lớn** cần sửa gấp. Các điểm ⚠️ (badge count mỗi render) là chi phí nhỏ, chấp nhận cho MVP.
- Đề xuất backlog: cache ngắn cho unread count nếu traffic tăng; đo cold-start route storage.
