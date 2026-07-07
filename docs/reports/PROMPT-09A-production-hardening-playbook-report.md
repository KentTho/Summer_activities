# Báo cáo PROMPT 09A — Production Hardening + Operational Playbook + DOCX Placeholder Merge

- **Ngày:** 2026-07-07
- **Project:** Web-App Điểm danh sinh hoạt hè
- **Tiếp nối:** `PROMPT-08C-id-audit-docx-export-admin-hardening-report.md`

## 1. Mục tiêu
Chuẩn hóa vận hành production: tích hợp 4 nhóm kiến thức thành playbook/checklist; preflight script;
ép đổi mật khẩu lần đầu; placeholder-merge DOCX từ mẫu upload; dọn dead code; phân trang Admin students;
docs OCR production; cập nhật health; backlog. **Không** UI polish lớn, **không** thư viện nặng,
**không** phá Auth/RBAC/RLS/CRUD/Attendance/OCR/Notification/DOCX 08C, **không** reset DB/drop/disable RLS.

## 2. Hiện trạng trước khi làm (08C)
DOCX export thật (bộ ghi ZIP/OOXML zero-dependency), mẫu `.docx` lưu Storage private, Admin
reports/students/settings hardening, health phase `08c-...`. Còn gợi ý: placeholder-merge, dọn mock,
ép đổi mật khẩu, ảnh OCR private, phân trang Admin students. DB remote đồng bộ (10 migration).

## 3. Audit 4 nhóm kiến thức user gửi
- **DevOps/Safe Deployment** → `safe-deployment-checklist.md` + `production-readiness-playbook.md`:
  lint/typecheck/build bắt buộc, backup trước migration lớn, no-deploy-Friday, rollback tức thời Vercel,
  health check, monitoring để backlog.
- **Auth Session/JWT** → `auth-session-hardening.md`: Supabase SSR/cookie, không localStorage token,
  không parse JWT ở client, RLS là lớp cuối, logout thu hồi server; logout-all/token-version → backlog.
- **SDLC Dev–BA–Tester** → `sdlc-debugging-test-plan.md`: acceptance criteria + luật quyền + test plan +
  report + debug đúng gốc (test bằng client đăng nhập thật).
- **AI Security/Vibe coding** → `ai-code-security-gate.md`: không hardcode secret, validate Zod server,
  review access control, không copy code AI mù quáng, duyệt tay output OCR/AI, chặn macro DOCX.

## 4. Playbook/checklist đã tạo
`production-readiness-playbook.md`, `safe-deployment-checklist.md`, `auth-session-hardening.md`,
`sdlc-debugging-test-plan.md`, `ai-code-security-gate.md`, `ocr-production-setup.md`,
`project-repair-backlog.md`. Viết dạng checklist áp dụng, không lý thuyết dài.

## 5. Preflight script
`scripts/preflight-check.mjs` + `npm run preflight`. Kiểm: (1) không commit tệp nhạy cảm/ignored;
(2) không rò rỉ **giá trị** secret trong tệp tracked (đọc `.env.local` ngoài git để so khớp — KHÔNG in
secret; chỉ nhận diện khóa bí mật thật, bỏ qua `_URL`/`NEXT_PUBLIC_`); (3) không còn import `@/lib/mock`;
(4) health phase không phải phase cũ. Kết quả: **PREFLIGHT OK** (5 secret kiểm, 0 rò rỉ).
Sự cố đã fix: ban đầu báo nhầm `OCR_SPACE_API_URL` (endpoint công khai) là secret → thu hẹp regex khóa
+ bỏ qua giá trị URL.

## 6. Password change flow
Cờ `must_change_password` nằm ở auth `user_metadata` (không phải cột DB). `getCurrentProfile` đọc cờ;
3 layout cổng redirect `/change-password` khi true. Trang `/change-password` (đặt **ngoài** layout cổng để
tránh vòng lặp redirect) + action `auth.updateUser({password, data:{must_change_password:false}})` — người
dùng đổi mật khẩu **của chính mình**, KHÔNG service role — xóa cờ → về `homeForRole`. Reset của Admin vẫn
bật cờ (đã có sẵn). **Đã chạy & verify** bằng user throwaway (đổi + xóa cờ + đăng nhập mật khẩu mới →
xóa user). **Lưu ý:** `admin@...` hiện còn cờ true → sẽ bị ép đổi khi vào cổng lần tới (đúng thiết kế).

## 7. DOCX placeholder merge
`src/lib/docx/unzip.ts` (đọc ZIP STORE + DEFLATE qua `node:zlib`, chuẩn hóa tên `\`→`/`) +
`merge.ts#mergeTemplate` (thay `{{key}}` escape XML, đa dòng → `<w:br/>`, re-zip). Hỗ trợ 8 placeholder.
`reports/template-merge.ts` xác thực quyền qua RLS (mẫu `active`) rồi đọc binary bằng service role
(mẫu là biểu mẫu trống). Route `reports/students`, `reports/attendance` nhận `?template=<id>`;
**fallback** DOCX tự sinh (08C) khi mẫu không có placeholder/hỏng. Trang `secretary/reports` có nút "Xuất
theo mẫu" + liệt kê placeholder. **Self-test** trên docx DEFLATE thật: thay hết placeholder, escape đúng,
`<w:br/>`, tiếng Việt OK; mẫu không placeholder → fallback. **Giới hạn** (ghi rõ): placeholder phải gọn
trong 1 run; không vòng lặp/điều kiện.

## 8. Mock cleanup
`git rm src/lib/mock/{admin,data,index,status,types}.ts` sau khi xác nhận **0 import** trong `src/scripts`.
Typecheck xanh.

## 9. Admin pagination
`listAllStudents` thêm `page/pageSize` (whitelist `[20,50,100]`, clamp) dùng `.range()` + count exact →
`total/page/totalPages`. UI: chọn pageSize (reset page=1), "Đang xem X–Y / total", nút Trước/Sau giữ
q/nb/status. Vẫn **chỉ đọc** (không CRUD Admin học sinh).

## 10. OCR production setup
`ocr-production-setup.md`: cần `OCR_SPACE_API_KEY` (server-only) + `OCR_PROVIDER=ocrspace` trên Vercel;
KHÔNG `NEXT_PUBLIC_`. Thiếu key → nút OCR disabled, nhập tay vẫn chạy, health `ocrConfigured:false`.
Không hardcode key; không tự thêm khi user chưa cấp.

## 11. Health
`/api/health` → phase `09a-production-hardening` + cờ `supabaseConfigured/databaseTypesReady/
ocrConfigured/docxExportReady/passwordChangeReady`. Không lộ giá trị key.

## 12. Tests / deploy / git
- `npm run preflight` ✅ · `lint` ✅ · `typecheck` ✅ · `build` ✅ (route `/change-password` xuất hiện).
- Smoke đổi mật khẩu (throwaway user) ✅ · self-test merge DOCX DEFLATE ✅.
- Deploy production + verify health/routes (mục N). Commit/push (mục P).

## 13. Chưa làm ở prompt này (đúng phạm vi)
Monitoring/logging tập trung; load test; lưu ảnh OCR private; engine DOCX nâng cao (vòng lặp/placeholder
tách run); logout-all/token-version thật; UI polish lớn.

## 14. Gợi ý bước tiếp theo
1. **Monitoring/logging nhẹ**: alert `/api/health` fail, gom log lỗi (không PII), uptime check.
2. **Lưu ảnh OCR vào private storage + audit** (hiện không giữ ảnh gốc).
3. **Load test** luồng điểm danh dồn cuối buổi; xem index/độ trễ.
4. **Nâng placeholder-merge**: hỗ trợ placeholder bị tách run (ghép run trước khi thay).

## 15. Các điểm dự án cần tu sửa thêm
- Dọn `DemoNotice` (chỉ export, không render ở app).
- Đồng bộ Postgres local `major_version` (15 local vs 17 remote) — chỉ ảnh hưởng dev.
- Cân nhắc rate-limit đăng nhập / khóa tạm sau nhiều lần sai (bảo mật).
- Bổ sung acceptance criteria dạng file cho các tính năng cũ (chuẩn hóa "done").

## 16. Những việc không nên làm ngay (tránh lan man)
- Logout-all/token-version, MFA/OTP thật — chưa cần, chỉ backlog.
- Engine DOCX đầy đủ (vòng lặp/bảng động) khi placeholder-merge tối giản đã đủ.
- Thêm thư viện nặng cho ZIP/DOCX khi bản zero-dependency đang chạy tốt.
- UI polish toàn hệ thống trước khi vận hành/giám sát ổn định.
- Admin CRUD học sinh (đã thuộc cổng Bí thư — tránh trùng quyền).
