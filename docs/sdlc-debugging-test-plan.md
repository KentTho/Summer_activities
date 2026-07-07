# SDLC · Debugging · Test Plan Checklist

> Prompt 09A. Rút gọn nhóm **SDLC Dev–BA–Tester** thành checklist cho dự án.
> Bổ trợ `engineering-guardrails.md §3`.

## Định nghĩa "Done" cho mỗi tính năng
- [ ] **Acceptance criteria** rõ (trạng thái + kết quả mong đợi).
- [ ] **Luật quyền**: ai được xem/sửa gì (map sang RLS trước khi code).
- [ ] **Test plan** tối thiểu (happy path + 1–2 biên/quyền).
- [ ] **Report** ghi việc đã làm + sự cố + nguyên nhân gốc.
- [ ] Cập nhật `PROJECT_PROGRESS.md` + `IMPLEMENTATION_HISTORY.md`.

## Test plan mẫu theo vai trò (smoke thủ công)
- [ ] **Đăng nhập**: Admin (cổng /admin), Bí thư/Chi Đoàn + Phụ huynh (cổng /user). Sai cổng → chặn.
- [ ] **Ép đổi mật khẩu**: tài khoản `must_change_password=true` bị ép `/change-password` trước khi vào.
- [ ] **CRUD học sinh** (Bí thư): thêm/sửa/xóa mềm, chỉ trong Khu phố phụ trách (RLS).
- [ ] **Điểm danh + xin nghỉ**: 4 trạng thái; phụ huynh chỉ con mình.
- [ ] **DOCX**: xuất DS học sinh / điểm danh (tự sinh) + theo mẫu có placeholder + fallback.
- [ ] **Admin**: students (search/filter/phân trang), reports (số liệu + xuất), settings (lưu whitelist).
- [ ] **Health**: `/api/health` phase + cờ đúng.

## Debug đúng gốc (khi có bug)
- [ ] Tái hiện → khoanh vùng: **RLS?** validation Zod? dữ liệu? render?
- [ ] Test lại bằng **client đăng nhập thật** (service role bỏ qua RLS → dễ ngộ nhận "chạy được").
- [ ] Sửa nguyên nhân, không vá triệu chứng. Ghi vào report (vd RLS `insert().select()` ở P07,
      đệ quy RLS 42P17 ở P08A, tên entry ZIP dùng `\` ở P09A).

## Load / hiệu năng (khi cần — backlog)
- [ ] Ghi điểm danh dồn cuối buổi → đã có index `attendance_records(session_id/student_id)`.
- [ ] Tránh N+1 ở `lib/data/*` (gộp truy vấn theo id). `/admin/students` đã phân trang.
