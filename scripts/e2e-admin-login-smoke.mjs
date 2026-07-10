/**
 * E2E đăng nhập ADMIN (09G). SERVER/LOCAL ONLY — service role CHỈ để seed/cleanup.
 *
 * Xác minh sau khi recovery, Admin đăng nhập được bằng session/JWT THẬT:
 *   1. Sai mật khẩu → signInWithPassword lỗi (không có session).
 *   2. Đúng mật khẩu → có session + JWT hợp lệ (getUser trả đúng user).
 *   3. Hồ sơ ADMIN active → tương đương cổng /admin cho vào (server auth flow).
 *   4. (Tùy chọn) E2E_BASE_URL: GET /admin/login = 200; GET /admin KHÔNG cookie = redirect login.
 *
 * Dùng tài khoản DISPOSABLE prefix SMOKE_09G_ — KHÔNG đụng Admin gốc.
 * KHÔNG in mật khẩu/JWT/cookie/secret. Cleanup sạch.
 *
 * Chạy:  node --env-file=.env.local scripts/e2e-admin-login-smoke.mjs
 *   Tùy chọn HTTP:  E2E_BASE_URL=https://<host> node --env-file=.env.local scripts/e2e-admin-login-smoke.mjs
 */
import { createClient } from "@supabase/supabase-js";
import { randomBytes } from "node:crypto";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const anonKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
if (!url || !serviceKey || !anonKey) {
  console.error(
    "BLOCKED: thiếu NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY / publishable key.",
  );
  console.error("Set trong .env.local (KHÔNG commit) rồi chạy: node --env-file=.env.local scripts/e2e-admin-login-smoke.mjs");
  process.exit(1);
}

const baseUrl = (process.env.E2E_BASE_URL ?? "").replace(/\/+$/, "");
const P = "SMOKE_09G_";
const svc = createClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } });
const pass = () => "Sh" + randomBytes(12).toString("base64url"); // ngẫu nhiên, KHÔNG in

const created = { authId: null, profileId: null };
let passed = 0;
let failed = 0;

function safeMessage(message) {
  return String(message ?? "")
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, "[email]")
    .replace(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, "[uuid]")
    .replace(/(sb_secret_|sbp_|AIza|eyJ)[A-Za-z0-9._-]+/g, "[secret]");
}
function check(name, cond) {
  if (cond) { passed++; console.log(`  ✓ ${name}`); }
  else { failed++; console.log(`  ✗ ${name}`); }
}

async function makeAdmin() {
  const email = `${P.toLowerCase()}adminlogin@sinhhoathe.local`;
  const password = pass();
  const { data, error } = await svc.auth.admin.createUser({
    email, password, email_confirm: true,
    user_metadata: { full_name: P + "AdminLogin", must_change_password: false },
  });
  if (error) throw error;
  created.authId = data.user.id;
  const { data: prof, error: pErr } = await svc
    .from("profiles")
    .upsert({ auth_user_id: data.user.id, role: "ADMIN", full_name: P + "AdminLogin", email, active: true }, { onConflict: "auth_user_id" })
    .select("id").single();
  if (pErr) throw pErr;
  created.profileId = prof.id;
  return { email, password };
}

async function main() {
  console.log(`[e2e-login] Target: ${new URL(url).host} · fixtures ${P}`);
  const { email, password } = await makeAdmin();
  console.log("[e2e-login] seed xong: 1 Admin disposable.");

  // 1) Sai mật khẩu → lỗi, KHÔNG có session.
  const cBad = createClient(url, anonKey, { auth: { persistSession: false } });
  const bad = await cBad.auth.signInWithPassword({ email, password: password + "_WRONG" });
  check("Sai mật khẩu → đăng nhập THẤT BẠI (không có session)", Boolean(bad.error) && !bad.data?.session);

  // 2) Đúng mật khẩu → có session + JWT hợp lệ.
  const cOk = createClient(url, anonKey, { auth: { persistSession: false } });
  const ok = await cOk.auth.signInWithPassword({ email, password });
  check("Đúng mật khẩu → có session (JWT cấp)", !ok.error && Boolean(ok.data?.session?.access_token));

  // 3) JWT hợp lệ → getUser trả đúng user (tương đương server auth flow của /admin).
  const who = await cOk.auth.getUser();
  check("JWT hợp lệ → getUser trả đúng user", !who.error && who.data?.user?.id === created.authId);

  // Hồ sơ ADMIN active (điều kiện cổng /admin cho vào) — đọc bằng RLS session Admin.
  const { data: prof } = await cOk.from("profiles").select("role, active").eq("auth_user_id", created.authId).maybeSingle();
  check("Hồ sơ role=ADMIN, active=true (cổng /admin cho vào)", prof?.role === "ADMIN" && prof?.active === true);

  // 4) HTTP (tùy chọn): route guard cổng /admin không cookie.
  if (baseUrl) {
    try {
      const loginPage = await fetch(`${baseUrl}/admin/login`, { redirect: "manual" });
      check(`GET /admin/login = 200 (nhận thấy ${loginPage.status})`, loginPage.status === 200);
      const adminNoCookie = await fetch(`${baseUrl}/admin`, { redirect: "manual" });
      const redirected = [301, 302, 303, 307, 308].includes(adminNoCookie.status);
      const loc = adminNoCookie.headers.get("location") ?? "";
      check(
        `GET /admin KHÔNG cookie → chuyển hướng login (status ${adminNoCookie.status})`,
        redirected && /login/i.test(loc),
      );
    } catch (e) {
      console.log(`  ⚠ HTTP check bỏ qua (không tới được ${baseUrl}): ${safeMessage(e.message)}`);
    }
  } else {
    console.log("  ⚠ Bỏ HTTP guard check: chưa set E2E_BASE_URL (chỉ kiểm tra Auth/JWT).");
  }
}

async function cleanup() {
  console.log("[e2e-login] cleanup fixtures…");
  try {
    if (created.profileId) await svc.from("profiles").delete().eq("id", created.profileId);
    if (created.authId) await svc.auth.admin.deleteUser(created.authId);
    console.log("[e2e-login] cleanup xong (không còn SMOKE_09G_ admin).");
  } catch (e) {
    console.error("[e2e-login] cleanup lỗi (kiểm thủ công SMOKE_09G_):", safeMessage(e.message));
  }
}

try {
  await main();
} catch (e) {
  failed++;
  console.error("[e2e-login] LỖI:", safeMessage(e.message ?? e));
} finally {
  await cleanup();
}
console.log(`\n[e2e-login] KẾT QUẢ: ${passed} pass · ${failed} fail`);
process.exit(failed > 0 ? 1 : 0);
