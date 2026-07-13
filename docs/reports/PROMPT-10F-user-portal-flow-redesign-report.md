# PROMPT 10F — User portal full UX refactor + flow consolidation + 10E deploy smoke

## 1. Mục tiêu
Refactor toàn bộ User Portal: gộp điều hướng lặp, sửa logic nút buổi vô lý, buổi
chung nhiều Khu phố cho chọn Khu phố điểm danh, gộp Đơn xin nghỉ + Thông báo, phủ
toast feedback, tối ưu layout desktop. Deploy + smoke 10E. Không đổi RLS/schema;
không avatar/parent-request-edit/realtime (10H).

## 2. Hiện trạng trước
- Sidebar Bí thư 9 mục, "Điểm danh" trùng chi tiết buổi; "Đơn xin nghỉ" & "Thông báo" rời.
- Nút Dừng/Hủy/Dời hiện cả khi buổi đã chốt/đã qua (vô lý).
- Buổi chung không cho chọn Khu phố để điểm danh riêng.
- Duyệt/từ chối đơn, lưu học sinh, import, hồ sơ: feedback inline nhỏ, không toast.
- 10E chưa deploy prod rõ ràng.

## 3. Deploy/smoke 10E
- 10E đã commit/push (`94c6936` + hardening `02b52a8`). Deploy prod thực hiện chung ở §20 (10F) → health phase
  cập nhật `10f-...`; smoke portal-separation + endpoint HTTP kiểm tra sau deploy.

## 4. UI UX Pro Max + Taste Skill áp dụng thế nào
- Không có skill package trong repo → áp dụng nguyên tắc trực tiếp (`docs/user-portal-redesign-principles-10F.md`):
  dense/no-slop, một-chức-năng-một-nơi, split-pane, sticky rail, compact roster, no
  illogical buttons, feedback rõ không spam, motion nhẹ. Dials 4/3/7.

## 5. User portal full audit
`docs/user-portal-full-audit-10F.md` — bảng từng trang (vấn đề · dư bước · khoảng
trống · fix 10F · backlog). Structural fixes làm trong 10F; dense redesign một số
trang để backlog.

## 6. Sidebar/nav consolidation
`nav-config.ts` SECRETARY 9 → 7 mục. Bỏ "Điểm danh", gộp "Đơn & thông báo". Badge
chưa đọc chuyển sang mục `/operations`. `docs/user-portal-navigation-map.md`.

## 7. Attendance nav duplicate removal
`/user/secretary/attendance` không còn trên sidebar → redirect `/sessions`. Điểm danh
là hành động trong chi tiết buổi (một nơi duy nhất).

## 8. Leave + notification operations page
`/user/secretary/operations` 2 tab (`OperationsTabs`):
- Đơn xin nghỉ (`LeaveRequestsPanel`): filter chờ/tất cả, duyệt/từ chối → toast.
- Thông báo (`NotificationsPanel`): composer chọn buổi đang hoạt động → gửi (`notifySessionParents`) + lịch sử; buổi đã hủy bị disable và server action cũng chặn.
Route cũ `/leave-requests` `/notifications` redirect vào tab tương ứng (không 404).

## 9. Session action logic cleanup
`sessionActionRules.ts` (`getSessionActionAvailability`, `isPastSessionDate`):
- Đã hủy → chỉ Khôi phục; Đã chốt → chỉ Mở lại; Đã qua (còn mở) → chỉ Chốt (ẩn Dời/Hủy
  + InlineAlert giải thích); Đang mở & chưa qua → Chốt/Dời/Hủy; Notify ẩn khi đã hủy.
- `SessionControlsClient` nhận `past`; server action + RLS vẫn guard cuối.
- Codex review hardening: `close/reopen/cancel/reschedule/notify` kiểm trạng thái buổi trên server; không chỉ dựa vào việc ẩn nút UI.

## 10. Joint session neighborhood attendance
`AttendanceRosterClient`: buổi >1 Khu phố → selector "Khu phố điểm danh" (Tất cả/từng
Khu phố) với số đếm; roster + counters lọc theo Khu phố chọn, "Tất cả" = tổng buổi.
Chỉ Khu phố trong roster server trả (RLS đã lọc theo phạm vi) → không nới RLS, không
điểm danh ngoài phạm vi. Chi tiết buổi hiển thị badge tất cả Khu phố tham gia.

## 11. Session detail redesign
Container 7xl (shell); split-pane `xl:grid-cols-3` (roster 2/3 cuộn riêng · rail sticky
1/3); header badge loại/trạng thái/đã qua + metadata + badge Khu phố.

## 12. Secretary dashboard redesign
Light touch: link "Đơn & thông báo" trỏ đúng `/operations`; container rộng hơn. Full
dense command-center → backlog.

## 13. Students page redesign
Light touch: toast thêm/sửa học sinh (`StudentForm`). ActionBar/DataTableShell/side-panel
→ backlog.

## 14. Import page redesign
Toast cho AI extract + lưu/duyệt dòng (`AiImportForm`, `EditableRow`). Dense table shell → backlog.

## 15. Reports/profile/parent polish
- Profile: toast lưu hồ sơ (`ProfileForm` dùng chung Admin/Secretary/Parent).
- Reports/parent: giữ nguyên chức năng; redesign dense → backlog.

## 16. Toast coverage
Điểm danh · điều khiển buổi · gửi thông báo · đơn xin nghỉ (duyệt/từ chối) · học sinh
(thêm/sửa) · import (AI/lưu dòng) · hồ sơ cá nhân. Toast tối đa 3, aria-live.

## 17. Performance/code cleanup
- Client component chỉ giữ UI state; data fetch ở `src/lib/data/*`; server action server-side.
- Tách component: `OperationsTabs`, `LeaveRequestsPanel`, `NotificationsPanel`,
  `sessionActionRules`, selector trong `AttendanceRosterClient`. Không component >400 dòng.
- Không thêm dependency.

## 18. Health/preflight
- Health phase `10f-user-portal-flow-redesign` + 5 cờ mới (giữ cờ cũ).
- `check-production-health` default 10F; preflight OLD_PHASES thêm 10e.

## 19. Runtime smoke
- Build PASS (route `/operations` + redirect `/attendance` `/leave-requests` `/notifications`).
- typecheck/lint xanh; preflight OK. Runtime prod smoke chạy ở §20 deploy.

## 20. Deploy/git
- Validation: preflight/lint/typecheck/build/smoke portal PASS.
- Stage file scope 10F (không `git add .`), không đụng file ngoài scope/deletion 10A.
- Commit: `feat(ux): redesign user portal flows and session operations`.
- Codex review hardening patch: siết guard action buổi/đơn và disable gửi thông báo vào buổi đã hủy.

## 21. Chưa làm
- Full dense redesign: dashboard, students/import table shell, reports loading, parent timeline.
- Toast: thông báo Admin, password requests, xóa mềm học sinh, confirm batch.
- Runtime prod smoke đầy đủ (login redirect + điểm danh + operations) — chạy sau deploy.
- Avatar/parent-request-edit/realtime (10H); Admin refactor (10G).
- 2 Bí thư chưa gán Khu phố; AI live smoke ảnh giới tính/chữ ký; deletion 10A.

## 22. Gợi ý bước tiếp theo
1. Chạy prod smoke sau deploy (redirect route cũ, operations tab, joint selector).
2. 10G: Admin portal full UX refactor.
3. 10H: avatar + parent request-edit + realtime.

## 23. Các điểm dự án cần tu sửa thêm
- Dense redesign các trang còn light-touch.
- `src/modules/*` skeleton — chốt kiến trúc.
- Deletion `PROMPT-10A` cần xử lý dứt điểm.
- 2 Bí thư chưa gán Khu phố.

## 24. Những việc không nên làm ngay
- Realtime/websocket (10H) — tránh phức tạp hạ tầng sớm.
- Chuyển tất cả action sang optimistic — toast là đủ cho phần lớn.
- Refactor `src/modules/*` giữa lúc đang refactor UX.
- Mở CRUD học sinh ở Admin (giữ ở cổng Bí thư).

## 25. Codex review prompt
> Review PR 10F (user portal flow refactor). Tập trung:
> 1. Nav/route compat — `/attendance` `/leave-requests` `/notifications` có redirect đúng, không 404, không loop?
> 2. `sessionActionRules` — rule ẩn nút có đúng (đã hủy/chốt/đã qua)? Server action còn guard khi UI ẩn?
> 3. `AttendanceRosterClient` joint selector — lọc Khu phố có chỉ trong phạm vi RLS? Counter theo Khu phố/tổng đúng? pendingRef/rollback còn nguyên?
> 4. `NotificationsPanel` composer — `notifySessionParents` nhận session_id đúng, người nhận do RLS/buổi, không rò Khu phố ngoài phạm vi?
> 5. `LeaveRequestsPanel` — duyệt vẫn đánh EXCUSED cho buổi mở? toast double-fire do useEffect?
> 6. Toast mở rộng (students/profile/import) — có double-fire? ProfileForm dùng chung 3 cổng có an toàn?
> 7. Có vô tình đổi RLS/schema/migration/logic AI import/DOCX? (không được). Không public bucket, không `using(true)`.
> Nếu có patch: validation + stage file cụ thể (không `git add .`) + commit/push.
