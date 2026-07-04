# components/forms

Form component tái sử dụng (login, student create/edit, session, leave request, notification composer…).

Phase 1: để trống có chủ đích. Mỗi form sẽ ghép:

- Field UI (mobile-first) từ `components/ui`
- Validation client + server bằng schema Zod trong `lib/validation` hoặc module tương ứng (spec §7)
