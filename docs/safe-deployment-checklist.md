# Safe Deployment Checklist (DevOps)

> Prompt 09A. Rút gọn nhóm kiến thức **DevOps/Safe Deployment** thành checklist cho dự án.
> Bổ trợ `devops-deploy-rollback-backup.md` (chi tiết) và `production-readiness-playbook.md`.

## Trước deploy
- [ ] `npm run preflight` (secret/ignored/health) xanh.
- [ ] `lint` + `typecheck` + `build` xanh — KHÔNG tắt rule để "cho qua".
- [ ] Nếu có migration lớn/không rõ tác động: **backup/snapshot DB trước** (Supabase dashboard),
      và ưu tiên additive/idempotent.
- [ ] Đọc diff lần cuối: có secret lỡ tay không? có `console.log` lộ PII không?

## Thời điểm deploy
- [ ] Tránh **thứ Sáu / cuối ngày** cho thay đổi rủi ro (khó ứng cứu). Hotfix nhỏ + có rollback thì OK.
- [ ] Deploy production: `npx vercel deploy --prod`.

## Sau deploy (verify)
- [ ] `curl https://summer-activities-theta.vercel.app/api/health` → phase đúng + cờ hợp lệ.
- [ ] `curl -I /`, `/admin/login`, `/user/login` → 200/redirect hợp lệ.
- [ ] Đăng nhập thử 1 vai trò; thử 1 luồng chính vừa đổi.

## Khi có sự cố
- [ ] Vercel **instant rollback** về deployment trước (immutable) — ưu tiên trước khi debug nóng.
- [ ] Không `db reset`/drop trên production. Sửa bằng migration bù additive.
- [ ] Ghi sự cố + nguyên nhân gốc + cách xử lý vào report của prompt.

## Backlog giám sát (chưa làm — xem `project-repair-backlog.md`)
- [ ] Alert khi `/api/health` fail; thu thập log lỗi tập trung; uptime check định kỳ.
