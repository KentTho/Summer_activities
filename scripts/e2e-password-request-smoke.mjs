/**
 * E2E luồng quên mật khẩu (09G). SERVER/LOCAL ONLY.
 *
 * Mô phỏng đúng luồng thật:
 *   1. Tạo tài khoản smoke (PARENT) prefix SMOKE_09G_ có phone khớp.
 *   2. Anon gọi RPC `request_password_reset` (như form công khai /forgot-password) → trung lập.
 *   3. Yêu cầu PENDING xuất hiện + matched_profile_id đúng (Admin đọc bằng RLS session Admin).
 *   4. Admin resolve: đặt lại mật khẩu tạm (service, sau khi đã kiểm ADMIN) + status=RESOLVED
 *      + audit RESOLVE_PASSWORD_RESET_REQUEST (như server action resolvePasswordRequest).
 *   5. Kiểm status RESOLVED.
 *   6. Kiểm audit KHÔNG chứa PII/mật khẩu (detail chỉ có id).
 *   7. Cleanup request + account. audit append-only → giữ lại, ghi rõ.
 *
 * KHÔNG in mật khẩu/secret/PII. Anon dùng RPC (SECURITY DEFINER) đúng như app.
 *
 * Chạy:  node --env-file=.env.local scripts/e2e-password-request-smoke.mjs
 */
import { createClient } from "@supabase/supabase-js";
import { randomBytes } from "node:crypto";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const anonKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
if (!url || !serviceKey || !anonKey) {
  console.error("BLOCKED: thiếu NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY / publishable key.");
  process.exit(1);
}

const P = "SMOKE_09G_";
const svc = createClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } });
const pass = () => "Sh" + randomBytes(12).toString("base64url"); // ngẫu nhiên, KHÔNG in
// Định danh smoke: SĐT 11 số bắt đầu 099 (giả lập, không phải người thật).
const smokePhone = "099" + String(Date.now()).slice(-8);
const smokeEmail = `${smokePhone}@sinhhoathe.local`;

const created = { authId: null, profileId: null, requestIds: [], adminAuthId: null, adminProfileId: null };
let passed = 0;
let failed = 0;

function safeMessage(m) {
  return String(m ?? "")
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, "[email]")
    .replace(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, "[uuid]")
    .replace(/(sb_secret_|sbp_|AIza|eyJ)[A-Za-z0-9._-]+/g, "[secret]");
}
function check(name, cond) {
  if (cond) { passed++; console.log(`  ✓ ${name}`); }
  else { failed++; console.log(`  ✗ ${name}`); }
}

async function makeUser(email, role, fullName, phone) {
  const password = pass();
  const { data, error } = await svc.auth.admin.createUser({
    email, password, email_confirm: true,
    user_metadata: { full_name: fullName, must_change_password: false },
  });
  if (error) throw error;
  const { data: prof, error: pErr } = await svc
    .from("profiles")
    .upsert({ auth_user_id: data.user.id, role, full_name: fullName, email, phone: phone ?? null, active: true }, { onConflict: "auth_user_id" })
    .select("id").single();
  if (pErr) throw pErr;
  return { authId: data.user.id, profileId: prof.id, email, password };
}

async function main() {
  console.log(`[e2e-pwreq] Target: ${new URL(url).host} · fixtures ${P}`);

  // Seed: 1 PARENT smoke có phone khớp + 1 Admin disposable (actor resolve).
  const parent = await makeUser(smokeEmail, "PARENT", P + "Parent", smokePhone);
  created.authId = parent.authId; created.profileId = parent.profileId;
  const admin = await makeUser(`${P.toLowerCase()}pwadmin@sinhhoathe.local`, "ADMIN", P + "PwAdmin");
  created.adminAuthId = admin.authId; created.adminProfileId = admin.profileId;
  console.log("[e2e-pwreq] seed xong: 1 PARENT (phone khớp) + 1 Admin disposable.");

  // 1) Anon gọi RPC request_password_reset (đúng luồng form công khai).
  const anon = createClient(url, anonKey, { auth: { persistSession: false } });
  const rpc = await anon.rpc("request_password_reset", { p_identifier: smokePhone, p_portal: "USER" });
  check("Anon gọi RPC request_password_reset không lỗi (trung lập, trả void)", !rpc.error);

  // Anon KHÔNG đọc được bảng (RLS chỉ Admin).
  const anonRead = await anon.from("password_reset_requests").select("id").limit(1);
  check("Anon KHÔNG đọc được password_reset_requests (RLS chặn)", (anonRead.data?.length ?? 0) === 0);

  // 2) Admin (RLS session Admin) thấy PENDING + matched_profile_id đúng.
  const cAdmin = createClient(url, anonKey, { auth: { persistSession: false } });
  const signin = await cAdmin.auth.signInWithPassword({ email: admin.email, password: admin.password });
  if (signin.error) throw signin.error;
  const { data: pending } = await cAdmin
    .from("password_reset_requests")
    .select("id, status, matched_profile_id")
    .eq("identifier", smokePhone)
    .eq("status", "PENDING")
    .maybeSingle();
  check("Admin thấy yêu cầu PENDING", Boolean(pending?.id));
  check("matched_profile_id khớp đúng PARENT smoke", pending?.matched_profile_id === parent.profileId);
  if (pending?.id) created.requestIds.push(pending.id);

  // 3) Admin resolve: reset mật khẩu tạm + RESOLVED + audit (mô phỏng resolvePasswordRequest).
  if (pending?.id) {
    const tempPassword = pass(); // KHÔNG in, KHÔNG lưu
    await svc.auth.admin.updateUserById(parent.authId, {
      password: tempPassword,
      user_metadata: { must_change_password: true },
    });
    await cAdmin
      .from("password_reset_requests")
      .update({ status: "RESOLVED", resolved_at: new Date().toISOString(), resolved_by: admin.profileId })
      .eq("id", pending.id);
    await cAdmin.from("audit_logs").insert({
      actor_id: admin.profileId, actor_role: "ADMIN",
      action: "RESOLVE_PASSWORD_RESET_REQUEST", entity: "password_reset_requests",
      detail: `request ${pending.id}, profile ${parent.profileId}`,
    });

    // 4) Status RESOLVED.
    const { data: after } = await cAdmin.from("password_reset_requests").select("status").eq("id", pending.id).maybeSingle();
    check("Yêu cầu chuyển RESOLVED", after?.status === "RESOLVED");

    // 5) Người dùng đăng nhập bằng mật khẩu tạm → có session (must_change_password=true).
    const cUser = createClient(url, anonKey, { auth: { persistSession: false } });
    const userLogin = await cUser.auth.signInWithPassword({ email: parent.email, password: tempPassword });
    check("PARENT đăng nhập bằng mật khẩu tạm → có session", !userLogin.error && Boolean(userLogin.data?.session));

    // 6) Audit RESOLVE_... tồn tại + KHÔNG chứa PII/mật khẩu.
    const { data: audit } = await cAdmin
      .from("audit_logs")
      .select("action, detail")
      .eq("action", "RESOLVE_PASSWORD_RESET_REQUEST")
      .order("created_at", { ascending: false })
      .limit(5);
    const row = (audit ?? []).find((r) => r.detail?.includes(pending.id));
    check("Audit RESOLVE_PASSWORD_RESET_REQUEST được ghi", Boolean(row));
    const detail = row?.detail ?? "";
    const hasPhone = detail.includes(smokePhone);
    const hasEmail = /@sinhhoathe\.local/i.test(detail);
    check("Audit detail KHÔNG chứa SĐT/email (PII) hay mật khẩu", !hasPhone && !hasEmail);
  }
}

async function cleanup() {
  console.log("[e2e-pwreq] cleanup fixtures…");
  try {
    for (const id of created.requestIds) await svc.from("password_reset_requests").delete().eq("id", id);
    // Dọn mọi request smoke còn sót theo identifier (kể cả REJECTED/PENDING trùng).
    await svc.from("password_reset_requests").delete().eq("identifier", smokePhone);
    if (created.profileId) await svc.from("profiles").delete().eq("id", created.profileId);
    if (created.authId) await svc.auth.admin.deleteUser(created.authId);
    if (created.adminProfileId) await svc.from("profiles").delete().eq("id", created.adminProfileId);
    if (created.adminAuthId) await svc.auth.admin.deleteUser(created.adminAuthId);
    console.log("[e2e-pwreq] cleanup xong. LƯU Ý: audit_logs append-only → dòng RESOLVE_... smoke được GIỮ LẠI (không xóa theo policy).");
  } catch (e) {
    console.error("[e2e-pwreq] cleanup lỗi (kiểm thủ công SMOKE_09G_):", safeMessage(e.message));
  }
}

try {
  await main();
} catch (e) {
  failed++;
  console.error("[e2e-pwreq] LỖI:", safeMessage(e.message ?? e));
} finally {
  await cleanup();
}
console.log(`\n[e2e-pwreq] KẾT QUẢ: ${passed} pass · ${failed} fail`);
process.exit(failed > 0 ? 1 : 0);
