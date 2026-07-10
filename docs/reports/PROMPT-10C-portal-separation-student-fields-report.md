# PROMPT 10C — Portal Separation + Codex 10B Patch Push + Student Extended Fields CRUD

**Trạng thái tổng:** ✅ Core hoàn tất. Codex 10B patches đã commit + migration restrict-execute đã push remote.
Public/User bỏ link Admin. Student extended fields hiển thị/sửa (Bí thư sửa; Admin/Parent xem). Validation xanh.
Deploy + verify: §13.

---

## 1. Mục tiêu
Apply/push Codex 10B fixes; tách cổng Admin khỏi public/User UI; hoàn thiện hiển thị/sửa field học sinh mới
(năm sinh/giới tính/chữ ký); cập nhật PROJECT_PROGRESS + kế hoạch; health 10c; deploy.

## 2. Hiện trạng trước
- 10B: profile center + AI import field, health 10b. Codex review 10B PASS WITH FIXES — patch còn ở working tree.
- Public `(public)/gioi-thieu` còn link "Cổng Admin"; `/forgot-password` còn option Quản trị.
- Field học sinh mới chưa hiển thị/sửa ở form Bí thư, bảng Admin, profile Phụ huynh.

## 3. Codex 10B patches applied/pushed
| Patch | File | Trạng thái |
|---|---|---|
| Zod max-length field AI | `src/lib/ai-import/index.ts` | ✅ có trong commit |
| Update/delete import row bind `row_id`+`batch_id` | `import/actions.ts` | ✅ |
| Notification xóa "mồ côi" khi insert recipient lỗi | `data/notifications.ts` | ✅ |
| Reschedule chỉ báo khi thực đổi ngày/giờ | `sessions/actions.ts` | ✅ |
| Route ảnh 503 kèm header no-store/nosniff (`textResponse`) | `documents/[documentId]/route.ts` | ✅ |
| Migration restrict RPC execute | `20260711030000_...sql` | ✅ **db push remote + gen types** |

## 4. Migration restrict RPC execute
`20260711030000_restrict_update_own_profile_execute.sql`: `revoke all ... from public/anon` + `grant execute ...
to authenticated` cho `update_own_profile(text,text)`. Giảm bề mặt RPC. **Không** drop function, không đổi RLS
bảng, không `using(true)`. Đã `supabase db push --linked` (remote khớp) + `gen types`.

## 5. Portal separation audit
| File | Vị trí | Loại | Hành động |
|---|---|---|---|
| `src/app/page.tsx` | landing | Public | Không có link Admin (giữ) + thêm copy không-link |
| `src/app/(public)/gioi-thieu/page.tsx` | giới thiệu | Public | **Bỏ link "Cổng Admin"** + copy không-link |
| `src/app/forgot-password/{page,ForgotPasswordForm}` | quên MK | Public | **Bỏ cổng Quản trị** — chỉ User |
| `src/app/user/(auth)/login/page.tsx` | user login | User | Không có link Admin (giữ) |
| `src/components/layout/nav-config.ts` (`ROLE_LOGIN_HREF.ADMIN`) | shell Admin | Internal | Giữ (chỉ dùng logout trong cổng Admin) |
| `docs/**` | tài liệu | Docs | Được phép nhắc `/admin` |

## 6. Public/User Admin link removal
- `(public)/gioi-thieu`: bỏ `<Link href="/admin/login">Cổng Admin</Link>`; thêm câu mô tả không-link.
- `/` landing: thêm "Cổng quản trị dành cho người được phân quyền và truy cập riêng theo đường dẫn quản trị." (không link).
- `/forgot-password`: chỉ cổng User; `ForgotPasswordForm` thay `<select>` cổng bằng `<input hidden value="USER">`,
  bỏ option "Quản trị viên". Admin dùng break-glass (`admin-access-recovery.md`).
- **Bảo mật:** đây là UX/bề mặt — **không** thay Auth/RBAC/RLS (Admin vẫn `/admin/login`, guard + RLS chặn thật).

## 7. Student extended fields CRUD/display
- **Bí thư (sửa)**: `StudentForm` thêm Năm sinh/Giới tính/Có chữ ký?/Ghi chú chữ ký; `students/actions.ts` schema
  validate (birth_year 4 số 1990..2100, gender enum, signature tri-state, note ≤200) + không ghi đè bừa; danh sách hiện field mới.
- **Admin (xem)**: `listAllStudents` select + map thêm `birthYear/gender/signaturePresent`; `/admin/students` hiển thị.
  CRUD học sinh vẫn thuộc cổng Bí thư (Admin read-only — backlog "Admin edit học sinh" nếu cần).
- Chữ ký chỉ **metadata** (có/không + note), KHÔNG lưu ảnh chữ ký.

## 8. Parent profile linked student display
- `getMyLinkedStudents` thêm `gender/signaturePresent`; `/user/parent/profile` hiển thị năm sinh/giới tính/chữ ký.
- **Parent KHÔNG tự sửa** — note "Thông tin học sinh do Bí thư/Quản trị quản lý. Cần chỉnh sửa, liên hệ Bí thư."
  Backlog (10E): Parent gửi yêu cầu sửa → Bí thư/Admin duyệt.

## 9. AI live smoke
Không có ảnh mẫu (có cột giới tính/chữ ký) trong phiên → **PASS WITH WARNINGS**. Prompt Gemini + normalize đã
static-verified: chỉ đọc trong ảnh, không suy đoán giới tính từ tên, thiếu để null. Đề nghị live-test khi có ảnh thật.

## 10. PROJECT_PROGRESS update
- Tick Prompt 10B done; thêm checklist Prompt 10C.
- Thay "Next planned prompts" cũ (06B/07/08/09/10) bằng **10C/10D/10E/10F**.
- Cập nhật rủi ro: 2 Bí thư chưa phân công; portal separation ✅; AI live smoke chờ ảnh; xóa PROMPT-10A tồn đọng;
  `src/modules/*` skeleton; email synthetic.

## 11. Health/preflight
- `/api/health.phase` = `10c-portal-separation-student-fields` + cờ `portalSeparationReady`/`studentExtendedFieldsReady`/
  `codex10bPatchApplied`/`progressPlanUpdated`. `check-production-health` default 10c; preflight OLD_PHASES thêm 10b. preflight ✅.

## 12. Runtime smoke
- Build OK (routes profile/students build). typecheck/lint/build xanh.
- `scripts/smoke-portal-separation.mjs` (`smoke:portal-separation`) — chạy sau deploy (§13).

## 13. Deploy/git
- Deploy `vercel deploy --prod`; verify health 10c + endpoints + portal smoke. Stage file cụ thể (không `git add .`).
- **Không stage (ngoài scope):** `.env.example`, reports cũ, **xóa PROMPT-10A** (tồn đọng — cần xác nhận).

## 14. Chưa làm
- AI live smoke với ảnh giới tính/chữ ký thật.
- Admin edit học sinh (hiện read-only); Parent request-edit flow (10E).
- Avatar; realtime notification; UI polish (10D/10E).

## 15. Gợi ý bước tiếp theo
1. Live-test AI import ảnh có cột Nam/Nữ + chữ ký → xác nhận không suy đoán.
2. 10D: UI/UX polish nhất quán Admin/User (không đổi nghiệp vụ).
3. 10E: avatar private storage + Parent request-edit + realtime notification.
4. Admin gán Khu phố cho 2 Bí thư.

## 16. Các điểm dự án cần tu sửa thêm
- Admin students read-only → chưa sửa được field mới ở cổng Admin (backlog Admin edit).
- Xử lý dứt điểm việc xóa `PROMPT-10A` trong working tree.
- `profiles.email` synthetic → tách "email liên hệ" nếu muốn user tự sửa.
- `src/modules/*` skeleton (chốt kiến trúc).

## 17. Những việc không nên làm ngay
- UI polish lớn (để 10D); refactor `src/modules/*`.
- Cho Parent tự sửa dữ liệu học sinh (cần flow duyệt).
- Suy đoán giới tính/năm sinh/chữ ký; lưu ảnh chữ ký.
- Nới `profiles_update`/RLS cho tiện.

## 18. Codex review prompt
> Review PR 10C (portal separation + student fields + Codex patch). Kiểm:
> 1. Public/User còn link/nút `/admin` nào không (landing, gioi-thieu, user login, forgot-password)? Admin vẫn vào `/admin/login`?
> 2. `smoke-portal-separation.mjs` có false-positive/negative do regex `hasAdminLink` không?
> 3. Student schema Bí thư: birth_year/gender/signature validate đúng? Có ghi đè null bừa khi sửa không?
> 4. Migration restrict-execute có làm hỏng luồng `update_own_profile` cho authenticated không?
> 5. Parent chỉ XEM học sinh (không có action sửa)? Có lộ HS người khác qua RLS không?
> 6. Có log PII (tên/SĐT/chữ ký) ở đâu không?
