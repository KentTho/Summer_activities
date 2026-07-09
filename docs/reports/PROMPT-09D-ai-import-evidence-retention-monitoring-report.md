# PROMPT 09D — AI Import Evidence Viewer + Retention + Monitoring Light + Prompt Criteria

> Trạng thái: **PASS**. Safe Execution Mode + Runtime Smoke Mode.
> Nhánh `main`. Không đổi RLS, không đổi schema, không migration mới.

## 1. Mục tiêu
Bổ sung route bảo mật xem/tải **ảnh gốc AI import** (đối chiếu khi AI đọc sai) + audit; retention dọn
ảnh cũ (dry-run mặc định); monitoring nhẹ (health check script + workflow); chuẩn hóa `raw_data.source="AI"`;
cập nhật health phase `09d`; tích hợp bộ tiêu chí prompt AI vào docs.

## 2. Hiện trạng trước
| File/Module | Hiện trạng trước | Rủi ro | Hành động 09D |
| --- | --- | --- | --- |
| Ảnh AI import | Lưu private `ai-import-uploads` + `uploaded_documents.import_batch_id` (09C); UI chỉ **liệt kê metadata**, chưa xem được | Không đối chiếu được khi AI đọc sai | Route xem/tải + nút UI |
| `uploaded_documents` | RLS `doc_select` = admin/uploaded_by | (giữ nguyên) | Route dùng scope **lô** (ib_select) + service role có ràng buộc |
| UI import `[batchId]` | Card "Ảnh gốc đã lưu" chỉ text | Không mở được ảnh | Thêm nút "Xem ảnh gốc" (không lộ path) |
| Download/view route | Chưa có | — | Tạo mới |
| `raw_data.source` | Dòng AI ghi `"GEMINI"` | Lệch với `import_batches.source='AI'` | Đổi thành `"AI"` |
| Monitoring | Chỉ logger redact (09B/09C) | Không có uptime check | Script + workflow + docs |
| Retention | Chưa có | Ảnh tích tụ vô hạn | Script dry-run/apply |

## 3. Prompt criteria đã tích hợp
- `docs/ai-agent-prompt-criteria.md` (mới) — bản **rút gọn cho dự án**: Safe Execution Mode, không mở/in env
  thật, không `git add .`, không phá DB/production, validation trước/sau, runtime smoke khi đổi runtime,
  report có next step, Claude Code triển khai / Codex review security. Trỏ tới bản đầy đủ
  `docs/universal_ai_project_prompt_criteria.md` (do user thêm) — **không tạo trùng** `AI_CODING_AGENT_RULES.md`.

## 4. Image viewer route + access control
`GET /user/secretary/import/[batchId]/documents/[documentId]` (`?download=1` để tải).
- **Xác thực trong route handler** (không dựa layout): `getCurrentProfile()`; PARENT/chưa đăng nhập → 403.
- **Scope lô qua RLS**: đọc `import_batches` bằng server client (RLS `ib_select`: ADMIN / chủ lô / Khu phố
  phụ trách). Không thấy lô → **404** (không lộ tồn tại).
- **Ràng buộc ảnh↔lô**: `getAiImportDocForBatch(documentId, batchId)` chỉ khớp khi doc thuộc đúng
  `import_batch_id` **và** bucket `ai-import-uploads` (service role, sau khi đã có quyền lô).
- Đọc nhị phân `downloadAiImportImage(path)`; stream `inline`/`attachment`, `Cache-Control: no-store`,
  `X-Content-Type-Options: nosniff`; mime whitelist ảnh (khác → octet-stream). **Không** trả bucket/path/URL.
- **Audit** `VIEW_AI_IMPORT_IMAGE` / `DOWNLOAD_AI_IMPORT_IMAGE` — chỉ id lô/tài liệu, không PII/path.

## 5. UI ảnh riêng tư
`import/[batchId]/page.tsx`: mỗi ảnh hiện "Ảnh N" + size + ngày + nút **"Xem ảnh gốc"** (mở tab mới, route
bảo mật). Copy: "Ảnh được lưu riêng tư để đối chiếu khi AI đọc sai. Không có liên kết công khai." Không path/URL.

## 6. Retention cleanup
`scripts/cleanup-ai-import-images.mjs` (+ `npm run cleanup:ai-import-images`).
- **Mặc định dry-run**; cần `--apply` mới xóa. `--days=N` (mặc định 90).
- Chỉ bucket `ai-import-uploads`: xóa nhị phân Storage (theo lô 100) + hàng `uploaded_documents`. **Không**
  đụng import batch/rows/students. Thiếu service role → **BLOCKED** (không crash). Chỉ in count/size/bucket/ngày.

## 7. Monitoring light
- `scripts/check-production-health.mjs` (+ `npm run healthcheck`): gọi `/api/health`, FAIL (exit≠0) nếu
  `status`≠ok hoặc `phase`≠`09d-…`. Không cần secret. Override qua arg/`HEALTH_URL`.
- `.github/workflows/healthcheck.yml`: cron mỗi 30' + push `main` + manual.
- `docs/monitoring-uptime.md`: hướng dẫn + định hướng alert (chưa làm Slack/Telegram).

## 8. raw_data.source consistency
`aiExtractRows`: dòng AI ghi `raw_data.source = "AI"` (trước là `"GEMINI"`). **`GEMINI`=provider kỹ thuật,
`AI`=nguồn nghiệp vụ**, đồng bộ `import_batches.source='AI'`. **Không** mass-update dữ liệu cũ.

## 9. Health/preflight
- `/api/health` phase = `09d-ai-import-evidence-monitoring`; thêm `aiImportImageViewerReady`,
  `aiImportRetentionReady`, `monitoringReady`; giữ các cờ cũ. Không expose key.
- `preflight-check.mjs`: thêm `09c-ai-import-hardening` vào OLD_PHASES (ép nhận phase mới). **PREFLIGHT OK.**

## 10. Validation & Runtime smoke
- `npm run preflight` → OK (phase 09d). `npm run lint` → sạch. `npm run typecheck` → sạch.
  `npm run build` → **Compiled successfully**; route `[batchId]/documents/[documentId]` xuất hiện (ƒ dynamic).
  `git diff --check` → OK (chỉ cảnh báo CRLF vô hại).
- **Smoke thực:**
  - Retention dry-run: `node scripts/cleanup-ai-import-images.mjs --days=90` → kết nối DB thật, 0 ứng viên,
    **không xóa**, exit 0.
  - Healthcheck (prod trước deploy): phát hiện `phase=09c` ≠ mong đợi → FAIL, **exit 1** (đúng).
  - Health local (dev host): 200, `phase=09d-…`, 3 cờ mới = true.
  - Route ảnh **chưa đăng nhập**: `307 → /user/login` (middleware chặn trước handler) → **unauthorized bị chặn**.
- **Chưa smoke bằng session thật** (cần đăng nhập): SECRETARY đúng lô xem được, cross-scope 404, ADMIN xem
  mọi lô, audit ghi. Đã kiểm bằng lập luận RLS + build; **cần xác minh sau deploy với tài khoản thật**.

## 11. Deploy / git
- Commit stage **file cụ thể** (không `git add .`). Không stage env/secret/ảnh.
- Deploy production: xem mục cuối (thực hiện sau khi commit/push nếu validation PASS).

## 12. Chưa làm
- Runtime smoke đầy đủ theo session (SECRETARY/ADMIN/cross-scope/audit) — cần tài khoản thật.
- Tự động chạy retention `--apply` định kỳ (chỉ để dry-run/manual ở prompt này).
- PDF cho AI import (vẫn chặn). Alert Slack/Telegram. Gom log tập trung.

## 13. Gợi ý bước tiếp theo
- **09E**: smoke ảnh gốc bằng 3 tài khoản thật (Admin/Bí thư đúng-sai scope) + kiểm audit rows; sau đó cân
  nhắc cron retention `--apply` (giữ 90–180 ngày) khi đã xác nhận an toàn.

## 14. Các điểm dự án cần tu sửa thêm
- `src/modules/*` phần lớn skeleton rỗng, logic thật ở `src/lib/*` (lệch `architecture.md`) — xem 10A backlog.
- `README.md` còn ghi trạng thái cũ ("Phase 1 — Scaffold").
- Chưa có test tự động trong CI (chỉ lint/typecheck/build).

## 15. Những việc không nên làm ngay
- Không mở public bucket ảnh / signed URL ra client. Không mass-update `raw_data.source` dữ liệu cũ.
- Không chạy retention `--apply` trên production khi chưa xác nhận cột mốc giữ ảnh + backup.
- Không nới RLS `doc_select`; scope xem ảnh đã đủ qua ràng buộc lô ở route.

## 16. Codex review prompt
> Bạn là Security Reviewer. Review thay đổi 09D (không sửa code, chỉ báo cáo rủi ro):
> 1. Route `import/[batchId]/documents/[documentId]`: xác thực trong handler có bỏ sót vai trò không?
>    Scope lô qua RLS + ràng buộc `import_batch_id`+bucket có ngăn IDOR (xem ảnh lô khác) không?
> 2. Dùng service role đọc nhị phân **sau** khi chứng minh quyền lô — có đường nào đọc ảnh không thuộc lô đã
>    ủy quyền? Header/Content-Disposition/mime có an toàn (không sniff, không path traversal) không?
> 3. Audit có ghi đủ và **không** PII/path không? UI có lộ path/URL/bucket không?
> 4. Retention script: có khả năng xóa nhầm ngoài bucket `ai-import-uploads`, hay đụng batch/rows/students
>    không? Dry-run mặc định có chắc chắn? Thiếu service role có crash không?
> 5. Healthcheck/workflow có rò rỉ secret không? Có mass-update dữ liệu cũ không?
