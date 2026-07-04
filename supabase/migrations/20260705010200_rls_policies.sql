-- =============================================================================
-- 04B · RLS enable + policies (deny-by-default)
-- Nguyên tắc:
--  * BẬT RLS trên MỌI bảng nghiệp vụ. Không có policy = bị chặn (deny-by-default).
--  * anon KHÔNG có policy nào ở bảng nhạy cảm => luôn bị chặn.
--  * Không dùng `using (true)` ở bảng dữ liệu cá nhân.
--  * Chặn cuối cùng ở đây (Postgres); UI/proxy chỉ là lớp tiện lợi.
-- Idempotent: drop policy if exists trước khi create.
-- =============================================================================

-- --- Bật RLS trên tất cả bảng ------------------------------------------------
do $$
declare
  t text;
  tables text[] := array[
    'profiles','neighborhoods','secretary_neighborhoods','guardians','students',
    'student_guardians','activity_sessions','session_neighborhoods','session_permissions',
    'attendance_records','leave_requests','notifications','notification_recipients',
    'uploaded_documents','import_batches','import_batch_rows','export_templates',
    'audit_logs','system_settings'
  ];
begin
  foreach t in array tables loop
    execute format('alter table public.%I enable row level security;', t);
  end loop;
end
$$;

-- ============================ profiles =======================================
-- Xem hồ sơ của chính mình; Admin xem tất cả. Tài khoản do Admin tạo/sửa/xóa.
drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles for select to authenticated
  using (id = public.current_profile_id() or public.is_admin());
drop policy if exists profiles_insert on public.profiles;
create policy profiles_insert on public.profiles for insert to authenticated
  with check (public.is_admin());
drop policy if exists profiles_update on public.profiles;
create policy profiles_update on public.profiles for update to authenticated
  using (public.is_admin()) with check (public.is_admin());
drop policy if exists profiles_delete on public.profiles;
create policy profiles_delete on public.profiles for delete to authenticated
  using (public.is_admin());

-- ========================== neighborhoods ===================================
-- Danh mục Khu phố: mọi người đã đăng nhập đọc được; chỉ Admin thay đổi.
drop policy if exists neigh_select on public.neighborhoods;
create policy neigh_select on public.neighborhoods for select to authenticated
  using (auth.uid() is not null);
drop policy if exists neigh_insert on public.neighborhoods;
create policy neigh_insert on public.neighborhoods for insert to authenticated
  with check (public.is_admin());
drop policy if exists neigh_update on public.neighborhoods;
create policy neigh_update on public.neighborhoods for update to authenticated
  using (public.is_admin()) with check (public.is_admin());
drop policy if exists neigh_delete on public.neighborhoods;
create policy neigh_delete on public.neighborhoods for delete to authenticated
  using (public.is_admin());

-- ===================== secretary_neighborhoods ==============================
-- Bí thư xem phân công của chính mình; chỉ Admin gán/gỡ.
drop policy if exists sn_select on public.secretary_neighborhoods;
create policy sn_select on public.secretary_neighborhoods for select to authenticated
  using (public.is_admin() or secretary_id = public.current_profile_id());
drop policy if exists sn_insert on public.secretary_neighborhoods;
create policy sn_insert on public.secretary_neighborhoods for insert to authenticated
  with check (public.is_admin());
drop policy if exists sn_update on public.secretary_neighborhoods;
create policy sn_update on public.secretary_neighborhoods for update to authenticated
  using (public.is_admin()) with check (public.is_admin());
drop policy if exists sn_delete on public.secretary_neighborhoods;
create policy sn_delete on public.secretary_neighborhoods for delete to authenticated
  using (public.is_admin());

-- ============================ guardians =====================================
-- Admin; phụ huynh xem hồ sơ của chính mình; Bí thư xem PH của học sinh trong phạm vi.
drop policy if exists guardians_select on public.guardians;
create policy guardians_select on public.guardians for select to authenticated
  using (
    public.is_admin()
    or profile_id = public.current_profile_id()
    or exists (
      select 1 from public.student_guardians sg
      where sg.guardian_id = guardians.id and public.can_access_student(sg.student_id)
    )
  );
drop policy if exists guardians_insert on public.guardians;
create policy guardians_insert on public.guardians for insert to authenticated
  with check (public.is_admin() or public.is_secretary());
drop policy if exists guardians_update on public.guardians;
create policy guardians_update on public.guardians for update to authenticated
  using (public.is_admin() or public.is_secretary())
  with check (public.is_admin() or public.is_secretary());
drop policy if exists guardians_delete on public.guardians;
create policy guardians_delete on public.guardians for delete to authenticated
  using (public.is_admin());

-- ============================ students ======================================
-- Nhạy cảm (trẻ em): Admin; Bí thư theo Khu phố; phụ huynh của chính học sinh.
drop policy if exists students_select on public.students;
create policy students_select on public.students for select to authenticated
  using (
    public.is_admin()
    or (deleted_at is null and (
      public.can_access_neighborhood(neighborhood_id) or public.is_guardian_of(id)
    ))
  );
drop policy if exists students_insert on public.students;
create policy students_insert on public.students for insert to authenticated
  with check (public.is_admin() or public.can_access_neighborhood(neighborhood_id));
drop policy if exists students_update on public.students;
create policy students_update on public.students for update to authenticated
  using (public.is_admin() or public.can_access_neighborhood(neighborhood_id))
  with check (public.is_admin() or public.can_access_neighborhood(neighborhood_id));
drop policy if exists students_delete on public.students;
create policy students_delete on public.students for delete to authenticated
  using (public.is_admin());

-- ========================= student_guardians ================================
drop policy if exists sg_select on public.student_guardians;
create policy sg_select on public.student_guardians for select to authenticated
  using (
    public.is_admin()
    or public.can_access_student(student_id)
    or public.is_guardian_of(student_id)
  );
drop policy if exists sg_insert on public.student_guardians;
create policy sg_insert on public.student_guardians for insert to authenticated
  with check (public.is_admin() or public.can_access_student(student_id));
drop policy if exists sg_update on public.student_guardians;
create policy sg_update on public.student_guardians for update to authenticated
  using (public.is_admin() or public.can_access_student(student_id))
  with check (public.is_admin() or public.can_access_student(student_id));
drop policy if exists sg_delete on public.student_guardians;
create policy sg_delete on public.student_guardians for delete to authenticated
  using (public.is_admin() or public.can_access_student(student_id));

-- ========================= activity_sessions ================================
-- Bí thư theo phạm vi buổi; phụ huynh xem buổi thuộc Khu phố của con.
drop policy if exists sessions_select on public.activity_sessions;
create policy sessions_select on public.activity_sessions for select to authenticated
  using (
    public.is_admin()
    or public.can_access_session(id)
    or exists (
      select 1 from public.session_neighborhoods snb
      join public.students s on s.neighborhood_id = snb.neighborhood_id
      where snb.session_id = activity_sessions.id and public.is_guardian_of(s.id)
    )
  );
drop policy if exists sessions_insert on public.activity_sessions;
create policy sessions_insert on public.activity_sessions for insert to authenticated
  with check (public.is_admin() or public.is_secretary());
drop policy if exists sessions_update on public.activity_sessions;
create policy sessions_update on public.activity_sessions for update to authenticated
  using (public.is_admin() or public.can_access_session(id))
  with check (public.is_admin() or public.can_access_session(id));
drop policy if exists sessions_delete on public.activity_sessions;
create policy sessions_delete on public.activity_sessions for delete to authenticated
  using (public.is_admin());

-- ======================= session_neighborhoods ==============================
drop policy if exists snb_select on public.session_neighborhoods;
create policy snb_select on public.session_neighborhoods for select to authenticated
  using (
    public.is_admin()
    or public.can_access_neighborhood(neighborhood_id)
    or public.can_access_session(session_id)
  );
drop policy if exists snb_insert on public.session_neighborhoods;
create policy snb_insert on public.session_neighborhoods for insert to authenticated
  with check (public.is_admin() or public.can_access_session(session_id));
drop policy if exists snb_update on public.session_neighborhoods;
create policy snb_update on public.session_neighborhoods for update to authenticated
  using (public.is_admin() or public.can_access_session(session_id))
  with check (public.is_admin() or public.can_access_session(session_id));
drop policy if exists snb_delete on public.session_neighborhoods;
create policy snb_delete on public.session_neighborhoods for delete to authenticated
  using (public.is_admin() or public.can_access_session(session_id));

-- ======================== session_permissions ==============================
-- Grant đặc biệt do Admin cấp; Bí thư chỉ xem grant của mình.
drop policy if exists sp_select on public.session_permissions;
create policy sp_select on public.session_permissions for select to authenticated
  using (public.is_admin() or secretary_id = public.current_profile_id());
drop policy if exists sp_insert on public.session_permissions;
create policy sp_insert on public.session_permissions for insert to authenticated
  with check (public.is_admin());
drop policy if exists sp_update on public.session_permissions;
create policy sp_update on public.session_permissions for update to authenticated
  using (public.is_admin()) with check (public.is_admin());
drop policy if exists sp_delete on public.session_permissions;
create policy sp_delete on public.session_permissions for delete to authenticated
  using (public.is_admin());

-- ========================= attendance_records ===============================
-- Bí thư ghi/sửa trong buổi & học sinh thuộc phạm vi; phụ huynh chỉ xem của con.
drop policy if exists att_select on public.attendance_records;
create policy att_select on public.attendance_records for select to authenticated
  using (
    public.is_admin()
    or public.can_access_session(session_id)
    or public.is_guardian_of(student_id)
  );
drop policy if exists att_insert on public.attendance_records;
create policy att_insert on public.attendance_records for insert to authenticated
  with check (
    public.is_admin()
    or (public.can_access_session(session_id) and public.can_access_student(student_id))
  );
drop policy if exists att_update on public.attendance_records;
create policy att_update on public.attendance_records for update to authenticated
  using (public.is_admin() or public.can_access_session(session_id))
  with check (
    public.is_admin()
    or (public.can_access_session(session_id) and public.can_access_student(student_id))
  );
drop policy if exists att_delete on public.attendance_records;
create policy att_delete on public.attendance_records for delete to authenticated
  using (public.is_admin() or public.can_access_session(session_id));

-- =========================== leave_requests =================================
-- Phụ huynh gửi cho con mình; Bí thư xử lý trong phạm vi.
drop policy if exists leave_select on public.leave_requests;
create policy leave_select on public.leave_requests for select to authenticated
  using (
    public.is_admin()
    or public.can_access_student(student_id)
    or public.is_guardian_of(student_id)
  );
drop policy if exists leave_insert on public.leave_requests;
create policy leave_insert on public.leave_requests for insert to authenticated
  with check (
    public.is_admin()
    or public.is_guardian_of(student_id)
    or public.can_access_student(student_id)
  );
drop policy if exists leave_update on public.leave_requests;
create policy leave_update on public.leave_requests for update to authenticated
  using (public.is_admin() or public.can_access_student(student_id))
  with check (public.is_admin() or public.can_access_student(student_id));
drop policy if exists leave_delete on public.leave_requests;
create policy leave_delete on public.leave_requests for delete to authenticated
  using (public.is_admin());

-- ============================ notifications =================================
drop policy if exists notif_select on public.notifications;
create policy notif_select on public.notifications for select to authenticated
  using (
    public.is_admin()
    or created_by = public.current_profile_id()
    or exists (
      select 1 from public.notification_recipients nr
      where nr.notification_id = notifications.id
        and nr.profile_id = public.current_profile_id()
    )
  );
drop policy if exists notif_insert on public.notifications;
create policy notif_insert on public.notifications for insert to authenticated
  with check (public.is_admin() or public.is_secretary());
drop policy if exists notif_update on public.notifications;
create policy notif_update on public.notifications for update to authenticated
  using (public.is_admin() or created_by = public.current_profile_id())
  with check (public.is_admin() or created_by = public.current_profile_id());
drop policy if exists notif_delete on public.notifications;
create policy notif_delete on public.notifications for delete to authenticated
  using (public.is_admin() or created_by = public.current_profile_id());

-- ======================= notification_recipients ============================
drop policy if exists nr_select on public.notification_recipients;
create policy nr_select on public.notification_recipients for select to authenticated
  using (
    public.is_admin()
    or profile_id = public.current_profile_id()
    or exists (
      select 1 from public.notifications n
      where n.id = notification_recipients.notification_id
        and n.created_by = public.current_profile_id()
    )
  );
drop policy if exists nr_insert on public.notification_recipients;
create policy nr_insert on public.notification_recipients for insert to authenticated
  with check (public.is_admin() or public.is_secretary());
-- Người nhận chỉ được cập nhật trạng thái đã đọc của chính mình.
drop policy if exists nr_update on public.notification_recipients;
create policy nr_update on public.notification_recipients for update to authenticated
  using (public.is_admin() or profile_id = public.current_profile_id())
  with check (public.is_admin() or profile_id = public.current_profile_id());
drop policy if exists nr_delete on public.notification_recipients;
create policy nr_delete on public.notification_recipients for delete to authenticated
  using (public.is_admin());

-- ========================= uploaded_documents ===============================
drop policy if exists doc_select on public.uploaded_documents;
create policy doc_select on public.uploaded_documents for select to authenticated
  using (public.is_admin() or uploaded_by = public.current_profile_id());
drop policy if exists doc_insert on public.uploaded_documents;
create policy doc_insert on public.uploaded_documents for insert to authenticated
  with check (public.is_admin() or public.is_secretary());
drop policy if exists doc_update on public.uploaded_documents;
create policy doc_update on public.uploaded_documents for update to authenticated
  using (public.is_admin() or uploaded_by = public.current_profile_id())
  with check (public.is_admin() or uploaded_by = public.current_profile_id());
drop policy if exists doc_delete on public.uploaded_documents;
create policy doc_delete on public.uploaded_documents for delete to authenticated
  using (public.is_admin() or uploaded_by = public.current_profile_id());

-- =========================== import_batches =================================
drop policy if exists ib_select on public.import_batches;
create policy ib_select on public.import_batches for select to authenticated
  using (
    public.is_admin()
    or created_by = public.current_profile_id()
    or (neighborhood_id is not null and public.can_access_neighborhood(neighborhood_id))
  );
drop policy if exists ib_insert on public.import_batches;
create policy ib_insert on public.import_batches for insert to authenticated
  with check (public.is_admin() or public.is_secretary());
drop policy if exists ib_update on public.import_batches;
create policy ib_update on public.import_batches for update to authenticated
  using (public.is_admin() or created_by = public.current_profile_id())
  with check (public.is_admin() or created_by = public.current_profile_id());
drop policy if exists ib_delete on public.import_batches;
create policy ib_delete on public.import_batches for delete to authenticated
  using (public.is_admin() or created_by = public.current_profile_id());

-- ========================= import_batch_rows ================================
drop policy if exists ibr_select on public.import_batch_rows;
create policy ibr_select on public.import_batch_rows for select to authenticated
  using (
    public.is_admin()
    or exists (
      select 1 from public.import_batches b
      where b.id = import_batch_rows.batch_id
        and (b.created_by = public.current_profile_id()
             or (b.neighborhood_id is not null and public.can_access_neighborhood(b.neighborhood_id)))
    )
  );
drop policy if exists ibr_write on public.import_batch_rows;
create policy ibr_write on public.import_batch_rows for all to authenticated
  using (
    public.is_admin()
    or exists (
      select 1 from public.import_batches b
      where b.id = import_batch_rows.batch_id and b.created_by = public.current_profile_id()
    )
  )
  with check (
    public.is_admin()
    or exists (
      select 1 from public.import_batches b
      where b.id = import_batch_rows.batch_id and b.created_by = public.current_profile_id()
    )
  );

-- ========================== export_templates ================================
-- Admin quản lý; Bí thư chỉ đọc template đang bật để xuất báo cáo.
drop policy if exists tpl_select on public.export_templates;
create policy tpl_select on public.export_templates for select to authenticated
  using (public.is_admin() or (active and public.is_secretary()));
drop policy if exists tpl_insert on public.export_templates;
create policy tpl_insert on public.export_templates for insert to authenticated
  with check (public.is_admin());
drop policy if exists tpl_update on public.export_templates;
create policy tpl_update on public.export_templates for update to authenticated
  using (public.is_admin()) with check (public.is_admin());
drop policy if exists tpl_delete on public.export_templates;
create policy tpl_delete on public.export_templates for delete to authenticated
  using (public.is_admin());

-- ============================= audit_logs ===================================
-- Append-only: chỉ Admin đọc; ai cũng ghi được hành động của mình; KHÔNG update/delete.
drop policy if exists audit_select on public.audit_logs;
create policy audit_select on public.audit_logs for select to authenticated
  using (public.is_admin());
drop policy if exists audit_insert on public.audit_logs;
create policy audit_insert on public.audit_logs for insert to authenticated
  with check (actor_id = public.current_profile_id() or actor_id is null or public.is_admin());
-- (Cố ý KHÔNG có policy UPDATE/DELETE => append-only cho mọi vai trò.)

-- =========================== system_settings ================================
-- Mọi người đăng nhập đọc (tên/logo/màu hiển thị); chỉ Admin sửa.
drop policy if exists settings_select on public.system_settings;
create policy settings_select on public.system_settings for select to authenticated
  using (auth.uid() is not null);
drop policy if exists settings_insert on public.system_settings;
create policy settings_insert on public.system_settings for insert to authenticated
  with check (public.is_admin());
drop policy if exists settings_update on public.system_settings;
create policy settings_update on public.system_settings for update to authenticated
  using (public.is_admin()) with check (public.is_admin());
-- (Không có policy DELETE => không ai xóa được single-row cấu hình.)
