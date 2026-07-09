# Monitoring & Uptime (nhẹ) — 09D

> Giám sát tối thiểu cho production. Không phụ thuộc secret. Không Slack/Telegram ở giai đoạn này.

## 1. Endpoint sức khỏe
`GET /api/health` trả JSON **không chứa secret**, chỉ cờ boolean cấu hình + `phase`.
- `status: "ok"`
- `phase: "09d-ai-import-evidence-monitoring"` (đổi mỗi prompt để phát hiện deploy cũ)
- Các cờ: `supabaseConfigured`, `geminiConfigured`, `aiImportReady`, `aiImportImageViewerReady`,
  `aiImportRetentionReady`, `monitoringReady`, …

## 2. Script kiểm tra
```bash
node scripts/check-production-health.mjs
# hoặc chỉ định URL khác:
node scripts/check-production-health.mjs https://<domain>/api/health
HEALTH_URL=https://<domain>/api/health node scripts/check-production-health.mjs
```
- PASS: in `OK: status=ok · phase=…`, exit 0.
- FAIL: `status` ≠ ok, `phase` ≠ phase mong đợi, HTTP lỗi, hoặc không gọi được → exit ≠ 0.

## 3. Kiểm nhanh bằng curl
```bash
curl -s https://summer-activities-theta.vercel.app/api/health
curl -I https://summer-activities-theta.vercel.app/user/login
curl -I https://summer-activities-theta.vercel.app/admin/login
```

## 4. Tự động hóa (tùy chọn)
- Đã có workflow `.github/workflows/healthcheck.yml` chạy định kỳ (cron) + khi push `main`.
  Cần cập nhật `EXPECT_PHASE` trong `scripts/check-production-health.mjs` mỗi lần đổi phase.
- Có thể cắm thêm dịch vụ uptime ngoài (UptimeRobot/BetterStack) trỏ vào `/api/health` — chỉ đọc,
  không secret.

## 5. Cảnh báo (alert) — định hướng
- Giai đoạn này: dựa vào cron GitHub Actions fail → email GitHub.
- Về sau (không làm ngay): thêm webhook Slack/Telegram khi healthcheck fail nhiều lần liên tiếp.
