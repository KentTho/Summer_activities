# PROMPT 10B — Product Logic Audit + User Profile Center + AI Import Field Upgrade

**Trạng thái tổng:** ✅ Core hoàn tất. Migration additive đã áp remote (gender/signature + RPC self-update),
AI import mở rộng field (không suy đoán), Profile center 3 vai trò, 3 docs audit. Validation xanh
(preflight/lint/typecheck/build). Deploy + verify: §12.

---

## 1. Mục tiêu
Rà soát logic User/Admin; thêm Trung tâm thông tin cá nhân 3 nhóm; nâng AI import nhận tên/năm sinh/giới
tính/chữ ký (thiếu để trống, không bịa); migration additive nếu cần; docs/health/report.

## 2. Hiện trạng trước
- Notification core + deploy hardening đã Done MVP (09H/09I). Chưa có trang thông tin cá nhân cho user.
- AI import chỉ nhận full_name/birth_date/guardian_phone. `students` có birth_year nhưng thiếu gender/signature.
- `profiles_update` RLS chỉ cho Admin → user chưa tự sửa hồ sơ.

## 3. Product logic audit User/Admin
`docs/product-logic-audit-10B.md` — bảng từng tính năng (Admin/Bí thư/Phụ huynh) với đánh giá "hợp lý khi
dùng thật?", rủi ro bug ẩn, hành động 10B, backlog. **Kết luận:** nền tảng đủ dùng thật quy mô pilot, không
cần refactor lớn; 10B bổ sung profile center + AI field; backlog: form CRUD HS hiển thị giới tính/chữ ký,
xác nhận trước gửi notification diện rộng, ảnh đại diện, quy trình phụ huynh đề nghị sửa thông tin HS.

## 4. Profile center
- Data: `src/lib/data/profile.ts` (`getMyProfileDetails`, `getMyNeighborhoodAssignments`, `getMyLinkedStudents`).
- Action: `src/lib/data/profile-actions.ts` `updateOwnProfile` → RPC `update_own_profile` + audit `UPDATE_OWN_PROFILE`.
- UI: `components/profile/ProfileForm.tsx` + `/admin/profile`, `/user/secretary/profile`, `/user/parent/profile`; nav 3 cổng.
- Tự cập nhật **họ tên + SĐT**. Email hiển thị (Admin quản lý — tránh phá matching password-reset synthetic email).
  Đổi mật khẩu qua `/change-password`. Bí thư thấy Khu phố/vai trò phụ trách; Phụ huynh thấy HS liên kết (chỉ xem).
- **Không** cho user đổi role/staff_title/active/neighborhood (RPC giới hạn cột; không nới `profiles_update`).

## 5. DB migration
- `20260711010000_student_gender_signature.sql` (additive): `students.gender` (check MALE/FEMALE/OTHER/UNKNOWN|null),
  `signature_present boolean`, `signature_note text`. Policy students cũ áp mọi cột → không cần policy mới.
- `20260711020000_update_own_profile.sql`: RPC `update_own_profile(full_name, phone)` SECURITY DEFINER, chỉ sửa
  cột an toàn của `current_profile_id()`. **Đã `db push` remote + `gen types`** → `database.types.ts` cập nhật.
- **Không** thêm `signature_image_path`, **không** lưu ảnh/crop chữ ký (đúng phạm vi).

## 6. AI import extended fields
- `src/lib/ai-import/types.ts`: AiDraftRow thêm `birth_year, gender, signature_present, signature_note`.
- `gemini.ts`: prompt mới — CHỈ đọc trong ảnh, **KHÔNG suy đoán giới tính từ tên**, thiếu để null, không markdown.
- `normalize.ts`: `normalizeBirthYear` (4 số 1990..2100), `normalizeGender` (map nhãn VN, không khớp → null),
  `normalizeSignaturePresent` (tri-state), `computeNeedsReview` gồm birth_year.
- `index.ts`: zod schema mở rộng + mapping chuẩn hóa.

## 7. Import UI / confirm
- `EditableRow.tsx`: thêm ô Năm sinh, Giới tính (select), Có chữ ký? (select tri-state), Ghi chú chữ ký.
- `page.tsx`: cảnh báo "AI có thể đọc sai — kiểm tra tên, năm sinh, giới tính, chữ ký trước khi xác nhận";
  dòng read-only hiện năm sinh/giới tính/chữ ký.
- `actions.ts`: rowSchema + AI payload (raw_data) + `confirmBatch` map field hợp lệ vào `students` (null không ghi bừa);
  audit `CONFIRM_AI_IMPORT` (số lượng, không PII). Vẫn chỉ tạo từ `reviewed=true`.

## 8. Vercel smoothness audit
`docs/vercel-runtime-smoothness-audit.md` — rà body size, route service role 503, storage private, DOCX,
password reset, healthcheck phase, CI/retention, notification count, runtime Node. **Không lỗi lớn**; điểm ⚠️
(unread count mỗi render) chấp nhận cho MVP; backlog cache ngắn nếu traffic tăng.

## 9. Network security notes (hình HTTPS/SSH)
`docs/network-security-notes.md` — HTTPS bắt buộc, không token qua URL, cookie HttpOnly/Secure, không log secret,
SSH/key chỉ cho hạ tầng, CI dùng GitHub Secrets, không public bucket dữ liệu học sinh, chữ ký chỉ metadata.
**Chỉ tài liệu vận hành — KHÔNG nhúng infographic vào UI.**

## 10. Health/preflight
- `/api/health.phase` = `10b-profile-ai-fields-logic-audit` + cờ `profileCenterReady`/`aiImportExtendedFieldsReady`/
  `productLogicAuditReady`/`vercelSmoothnessAuditReady` (giữ cờ cũ). `check-production-health` default + preflight
  OLD_PHASES thêm 09h. preflight ✅.

## 11. Runtime smoke
- Build routes `/admin/profile`, `/user/secretary/profile`, `/user/parent/profile` OK.
- Typecheck/build xanh với migration types mới. AI import field flow qua typecheck.
- Live smoke AI (ảnh thật) không chạy trong phiên (cần ảnh mẫu) → nhập tay + gemini prompt static verified.
  **PASS WITH WARNINGS** cho phần cần ảnh thật.

## 12. Deploy/git
- Deploy `vercel deploy --prod`; verify health phase 10b + endpoints (xem cuối). Stage file cụ thể (không `git add .`).
- **Không stage (ngoài scope):** `.env.example`, reports cũ (linter), **xóa PROMPT-10A** (deletion tồn từ trước — cần xử lý riêng).

## 13. Chưa làm
- Ảnh đại diện; form CRUD học sinh hiển thị/sửa giới tính+chữ ký (Admin/Bí thư); lưu ảnh crop chữ ký (private).
- Quy trình phụ huynh đề nghị sửa thông tin học sinh qua Bí thư/Admin.
- Live smoke AI với ảnh có cột giới tính/chữ ký thật.

## 14. Gợi ý bước tiếp theo
1. Thêm form CRUD học sinh (Bí thư/Admin) hiển thị + sửa `birth_year/gender/signature_present/note`.
2. Live-test AI import với ảnh danh sách có cột Nam/Nữ + chữ ký → xác nhận không suy đoán.
3. Ảnh đại diện (avatar) qua private storage + route xác thực.
4. Xác nhận 2 bước khi Admin gửi notification SYSTEM diện rộng.

## 15. Các điểm dự án cần tu sửa thêm
- Bảng học sinh (Admin/Bí thư) chưa hiển thị field mới → dữ liệu nhập vào chưa nhìn thấy nơi khác.
- `profiles.email` = synthetic login email → chưa cho user tự sửa (tránh phá password-reset). Cần tách "email liên hệ" riêng nếu muốn user tự sửa.
- Chốt kiến trúc `src/modules/*` (vẫn skeleton).

## 16. Những việc không nên làm ngay
- Suy đoán giới tính/năm sinh/chữ ký từ AI hoặc từ tên.
- Lưu ảnh/crop chữ ký học sinh trong 10B (nhạy cảm — cần thiết kế private + review riêng).
- Nới `profiles_update` cho user (rủi ro tự đổi role/quyền) — giữ RPC giới hạn cột.
- Refactor UI lớn / đổi DOCX engine / mở PDF AI import.

## 17. Codex review prompt
> Review PR 10B (profile center + AI fields, migration additive). Kiểm:
> 1. RPC `update_own_profile`: có rò rỉ đổi role/active/staff_title/email không? Chỉ sửa của chính chủ (`current_profile_id`)?
> 2. AI import: gemini prompt/normalize có chỗ nào SUY ĐOÁN giới tính/năm sinh/chữ ký không? Field thiếu có để null đúng không?
> 3. `confirmBatch`: map gender/signature/birth_year có validate trước khi ghi students không? Có ghi đè null bừa không? Vẫn chỉ reviewed=true?
> 4. Profile pages: có lộ dữ liệu người khác qua RLS không (assignments/linked students đúng của mình)?
> 5. Migration additive-only, không drop/disable RLS/using(true)? Check constraint gender hợp lý?
> 6. Có log PII (tên/SĐT/chữ ký/base64) ở audit/log không?
