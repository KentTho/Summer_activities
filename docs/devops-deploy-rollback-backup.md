# DevOps — Deploy / Rollback / Backup (chọn lọc, không lan man)

> Thêm ở **Prompt 06B**. Ghi những gì áp dụng thật cho dự án nhỏ này, không lý thuyết thừa.

## 1. Kiến trúc triển khai

- **Frontend/Server (Next.js):** Vercel (production: `summer-activities-theta.vercel.app`).
  Framework preset `nextjs` khai báo ở `vercel.json` (Prompt 04A — fix 404).
- **Database + Auth + Storage:** Supabase (project `ymtogeacpnlmthjlryrd`).
- **Secrets:** biến môi trường ở Vercel (public) + `.env.local` khi chạy local. Key
  server-only (service role, Gemini) **không** để tiền tố `NEXT_PUBLIC_`.

## 2. Pipeline deploy

1. `npm run typecheck && npm run lint && npm run build` (bắt buộc pass trước khi push).
2. Commit theo Conventional Commits; push `main`.
3. Vercel auto-build & deploy. PR/nhánh khác → Preview deployment.
4. Sau deploy: kiểm `/api/health` (`supabaseConfigured: true`) + vài route chính (200).

## 3. Rollback

- **App (Vercel):** mỗi deploy là immutable. Lỗi production → **Instant Rollback** về
  deployment trước trong Vercel Dashboard (hoặc `vercel rollback`). Không cần rebuild.
- **Code:** `git revert <sha>` (không `reset --hard` trên nhánh chung) → push → Vercel
  deploy lại bản đã revert.
- **DB migration:** migration viết **additive/idempotent** (xem 06A: chỉ THÊM cột).
  Tránh drop/rename cột đang dùng. Nếu buộc phải đổi: viết migration nghịch đảo trước,
  test trên project preview/branch của Supabase, rồi mới áp remote.

## 4. Backup & khôi phục dữ liệu

- **Supabase:** bật **Point-in-Time Recovery / daily backup** (theo plan). Trước thao
  tác rủi ro (đổi schema lớn, xóa hàng loạt) → chụp backup thủ công (`pg_dump` hoặc
  snapshot dashboard).
- **Không** chạy seed demo hay `reset` lên **production**. Seed chỉ cho local/dev.
- **Migrations là nguồn sự thật của schema** (`supabase/migrations/`) — không sửa schema
  bằng tay trên dashboard mà không ghi lại thành migration.
- **Kiểm tra khôi phục:** định kỳ thử restore vào project tạm để chắc backup dùng được
  (backup không test = không có backup).

## 5. Quan sát & cảnh báo (mức tối thiểu)

- `/api/health` cho uptime check ngoài (UptimeRobot/cron).
- Log lỗi Server Action/route ở Vercel Logs; **không** log PII/secret.
- Audit log nghiệp vụ (xem `security.md`) cho hành động nhạy cảm.

## 6. Checklist trước mỗi release

- [ ] typecheck + lint + build pass.
- [ ] Không commit `.env.local`, `.vercel/`, `supabase/.temp/`, secret, key.
- [ ] Migration additive/idempotent, đã test áp remote (dry-run `db push`).
- [ ] Env server-only không rò rỉ ra client (không `NEXT_PUBLIC_`).
- [ ] Có đường rollback rõ ràng (deploy trước còn đó / migration nghịch đảo).
