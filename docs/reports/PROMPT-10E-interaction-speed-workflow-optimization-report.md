# PROMPT 10E — Interaction speed + Workflow logic audit + Attendance UX optimization

## 1. Mục tiêu
Tối ưu **tốc độ tương tác** và **logic luồng** cho người dùng thật: điểm danh
phản hồi nhanh (optimistic), toast góc phải nhất quán, layout buổi sinh hoạt tận
dụng desktop, login vào thẳng portal khi đã có phiên, rà soát flow dư thừa. Không
đổi RLS/schema/migration; không avatar/parent-request-edit/realtime (dời 10F/10G).

## 2. Hiện trạng trước
- Trang điểm danh: mỗi trạng thái là một `<form action={markAttendance}>` server
  action + `revalidatePath` → **click chậm, reload cả trang, mất cuộn/tìm kiếm**.
- Tìm kiếm roster: form GET reload trang.
- Chốt/mở/hủy/dời buổi: server action `void`, **không phản hồi** rõ.
- Session detail: 1 cột hẹp (`max-w-5xl`), desktop dư khoảng trống.
- Login: đã có phiên vẫn có thể render lại/hop thừa (đặc biệt must-change-password).
- Chưa có hệ thống toast dùng chung.

## 3. Workflow logic audit
`docs/workflow-logic-audit-10E.md` — bảng theo 4 nhóm (Auth / Bí thư / Phụ huynh /
Admin) với: hiện trạng · bước dư/chậm · rủi ro · fix 10E · backlog. Kết luận ưu
tiên: (1) điểm danh, (2) login redirect, (3) feedback thao tác buổi. Các toast còn
lại (CRUD học sinh/đơn nghỉ/profile/Admin) ghi backlog.

## 4. Login redirect fix
- `/user/login` & `/admin/login`: đã có phiên → `redirect(homeForRole(role))`;
  `must_change_password` → `/change-password` (bỏ 1 hop thừa).
- ADMIN vào `/user/login` → `/admin` (không lọt portal User). Sai vai trò ở
  `/admin/login` → về đúng khu vực role.
- Không loop với `/change-password` (trang nằm ngoài layout cổng, tự guard).
- Chi tiết: `docs/auth-redirect-flow.md`.

## 5. Toast system
- `src/components/ui/ToastProvider.tsx` (+ `useToast`) nhẹ, **không thư viện ngoài**.
- Góc phải-trên, `aria-live="polite"` (lỗi/cảnh báo `role="alert"`), auto-dismiss ~3.2s, nút đóng.
- Bọc trong `DashboardShell` → phủ toàn bộ cổng Admin + User.
- `useToast()` an toàn khi chưa có provider (no-op). Không chứa logic nghiệp vụ.

## 6. Attendance optimistic UI
- `markAttendanceAction(input): {ok,error?}` — **không** `revalidatePath` cả trang.
- `AttendanceRosterClient.tsx`: state client là nguồn optimistic; click → đổi local
  ngay + pending theo hàng → gọi action → OK toast / lỗi rollback + toast.
- **Counter optimistic** (có mặt/có phép/không phép/chưa điểm danh).
- **Tìm kiếm client** (`useDeferredValue`) — không reload, giữ cuộn.
- **Chống double-click/race**: hàng đang gửi `disabled`; bỏ click trùng trạng thái.
- Buổi chốt/hủy → khóa UI + server chặn (`closed_at`/`canceled_at`); RLS guard cuối.
- `AttendanceStatusButtons.tsx`: nhóm nút thuần trình bày, màu theo trạng thái.

## 7. Session detail layout desktop/mobile
- `DashboardShell` container `max-w-5xl → max-w-6xl` (giảm khoảng trống desktop).
- Lưới `xl:grid-cols-3`: cột chính (2/3) card "Điểm danh" (counter + tìm kiếm +
  roster cuộn riêng `max-h-[62vh]`); cột phải (1/3) **sticky** điều khiển + gửi thông báo.
- Mobile: stack dọc, nút điểm danh đủ lớn, wrap gọn.

## 8. Smooth feedback actions
- `closeSession/reopenSession/cancelSession/uncancelSession/rescheduleSession` đổi
  chữ ký sang `(_prev, formData) => SessionActionState`; giữ `revalidatePath` + auto-notify.
- `SessionControlsClient.tsx` (useActionState + useEffect) toast từng hành động.
- `NotifyParentsForm` thêm toast success/error (vẫn giữ text inline).

## 9. Redundant step cleanup
- Bỏ 4 `<form>` submit riêng của điểm danh.
- Bỏ form GET tìm kiếm reload (chuyển client-side).
- Bỏ `searchParams.q` khỏi session detail.
- Login bỏ bước "quay lại"/hop thừa.

## 10. Admin/User small fixes
- Audit ghi backlog Admin (CRUD học sinh, toast các thao tác) — **không** mở CRUD lớn
  Admin trong 10E. Container rộng hơn giúp cả Admin bớt khoảng trống.

## 11. Health/preflight
- Health phase → `10e-interaction-speed-workflow-optimization` + cờ
  `interactionOptimizationReady`/`attendanceOptimisticReady`/`loginRedirectReady`/`workflowAuditReady` (giữ cờ cũ).
- `scripts/check-production-health.mjs` default phase 10E.
- `scripts/preflight-check.mjs` OLD_PHASES thêm `10d-ui-ux-polish`.

## 12. Runtime smoke
- `npm run preflight` OK (phase 10E). `typecheck` xanh. (Xem §13 validation.)
- Runtime login/điểm danh cần `.env.local`/deploy → chạy khi vận hành (mục Chưa làm).

## 13. Deploy/git
- Validation: preflight/lint/typecheck/build/healthcheck/smoke portal (xem log commit).
- Stage **file trong scope 10E** (không `git add .`), giữ nguyên các thay đổi ngoài
  scope đang có trong working tree (report cũ, script *.mjs, `.env.example`, deletion 10A).
- Commit: `perf(ux): optimize attendance interactions and workflow redirects`.

## 14. Chưa làm
- Runtime smoke login-redirect + điểm danh optimistic trên môi trường thật (cần `.env.local`/deploy).
- Toast cho: profile save, CRUD học sinh, đơn nghỉ, thông báo Admin, password requests, import row.
- Avatar/parent-request-edit/realtime (10F/10G).
- 2 Bí thư chưa phân công Khu phố (chờ Admin).
- AI live smoke ảnh giới tính/chữ ký thật.
- Deletion `docs/reports/PROMPT-10A...` (ngoài scope — chỉ ghi nhận, chưa xử lý).

## 15. Gợi ý bước tiếp theo
1. Deploy + chạy runtime smoke (login redirect + điểm danh 4 trạng thái + refresh đối chiếu DB).
2. Áp toast cho các form còn lại (đã có hệ thống) — nhanh, ít rủi ro.
3. 10F: avatar private storage + parent request-edit + realtime notification.

## 16. Các điểm dự án cần tu sửa thêm
- `src/modules/*` phần lớn skeleton — chốt kiến trúc hoặc dọn.
- Admin học sinh mới read-only — cân nhắc CRUD có kiểm soát.
- Xử lý dứt điểm deletion `PROMPT-10A` (khôi phục hoặc commit có chủ đích).
- 2 Bí thư chưa gán Khu phố.

## 17. Những việc không nên làm ngay
- Realtime subscription / websocket (dời 10F) — tránh phức tạp hạ tầng sớm.
- Chuyển **tất cả** action sang optimistic — chỉ điểm danh cần; còn lại toast là đủ.
- Refactor lớn `src/modules/*` giữa lúc đang tối ưu UX.
- Thêm thư viện toast nặng khi bản tự viết đã đủ.

## 18. Codex review prompt
> Review PR 10E (interaction speed + attendance optimistic UI). Tập trung:
> 1. `markAttendanceAction` — có giữ guard buổi chốt/hủy + RLS? Có rò dữ liệu ngoài phạm vi?
> 2. `AttendanceRosterClient` — optimistic state + rollback có đúng khi lỗi/exception?
>    Race/double-click có được chặn (pending theo hàng)? Counter optimistic có lệch DB?
> 3. `SessionControlsClient`/`NotifyParentsForm` — toast có double-fire do useEffect deps?
> 4. Login redirect — có loop với `/change-password`? ADMIN có lọt portal User? Sai vai trò xử lý đúng?
> 5. `ToastProvider` — memory leak timer? aria-live đúng? no-op an toàn khi thiếu provider?
> 6. Có vô tình đổi RLS/schema/migration/logic AI import/DOCX không? (không được).
> Nếu có patch, tuân thủ: không public bucket, không `using(true)`, không `git add .`, stage file cụ thể.
