/**
 * Cấp phát tài khoản Bí thư/Chi Đoàn theo yêu cầu (09E). SERVER/LOCAL ONLY.
 *
 * ⚠️ KHÔNG hardcode mật khẩu vào source/report. Đọc danh sách từ env RUNTIME:
 *   NEW_SECRETARY_ACCOUNTS_JSON='[{"identifier":"0944577905","full_name":"...","password":"***"}]'
 * Cần: NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY (bỏ qua RLS).
 *
 * Cách chạy (KHÔNG commit .env.local, KHÔNG in mật khẩu):
 *   node --env-file=.env.local scripts/provision-secretaries.mjs
 *
 * Mỗi tài khoản:
 *   - role SECRETARY, staff_title mặc định "Bí thư", active=true.
 *   - must_change_password=true (ép đổi mật khẩu lần đầu).
 *   - KHÔNG tự gán Khu phố (để "chưa phân công" — Admin phân công sau).
 * Idempotent theo email tổng hợp. KHÔNG in mật khẩu.
 */
import { randomBytes } from "node:crypto";
import { createClient } from "@supabase/supabase-js";

/** Mật khẩu tạm ngẫu nhiên đủ mạnh (KHÔNG in ra) khi không được cấp sẵn. */
function randomTempPassword() {
  return "Sh" + randomBytes(12).toString("base64url");
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceKey) {
  console.error("BLOCKED: thiếu NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY.");
  process.exit(1);
}

const raw = process.env.NEW_SECRETARY_ACCOUNTS_JSON;
if (!raw) {
  console.error("BLOCKED: thiếu NEW_SECRETARY_ACCOUNTS_JSON (mảng JSON các tài khoản).");
  console.error('Ví dụ: NEW_SECRETARY_ACCOUNTS_JSON=\'[{"identifier":"0944577905"},{"identifier":"0368103532"}]\'');
  console.error('(password tùy chọn; bỏ trống → sinh mật khẩu tạm ngẫu nhiên, Admin đặt lại sau.)');
  process.exit(1);
}

let accounts;
try {
  accounts = JSON.parse(raw);
  if (!Array.isArray(accounts) || accounts.length === 0) throw new Error("rỗng");
} catch {
  console.error("BLOCKED: NEW_SECRETARY_ACCOUNTS_JSON không phải JSON mảng hợp lệ.");
  process.exit(1);
}

const SYNTHETIC_EMAIL_DOMAIN = "sinhhoathe.local";
/** Giữ ĐỒNG BỘ với src/lib/auth/identifier.ts */
function identifierToEmail(rawInput) {
  const input = String(rawInput).trim();
  if (input.includes("@")) return input.toLowerCase();
  const digits = input.replace(/[^\d]/g, "");
  const isPhone = /^\+?\d[\d\s.-]*$/.test(input) && digits.length >= 6;
  const local = isPhone ? digits : input.toLowerCase().replace(/[^a-z0-9]/g, "");
  return `${local}@${SYNTHETIC_EMAIL_DOMAIN}`;
}

/** Che định danh khi in log: chỉ 3 số cuối. */
function maskId(identifier) {
  const s = String(identifier);
  return s.length <= 3 ? "***" : "***" + s.slice(-3);
}

const admin = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function findUserByEmail(email) {
  let page = 1;
  for (;;) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw error;
    const found = data.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
    if (found) return found;
    if (data.users.length < 200) return null;
    page += 1;
  }
}

async function ensureSecretary(acc) {
  const identifier = String(acc.identifier ?? "").trim();
  if (!identifier) throw new Error("thiếu identifier");
  // Mật khẩu: dùng của user nếu cấp (≥6 ký tự), nếu không → sinh ngẫu nhiên mạnh (không in).
  // Dù thế nào cũng must_change_password=true → user/Admin đặt lại mật khẩu thật sau.
  const provided = String(acc.password ?? "");
  const password = provided.length >= 6 ? provided : randomTempPassword();
  const fullName = String(acc.full_name ?? acc.fullName ?? `Bí thư ${maskId(identifier)}`).trim();
  const staffTitle = acc.staff_title === "Chi Đoàn" ? "Chi Đoàn" : "Bí thư";
  const phone = /^\+?\d[\d\s.-]*$/.test(identifier) ? identifier.replace(/[^\d]/g, "") : null;
  const email = identifierToEmail(identifier);

  let user = await findUserByEmail(email);
  if (user) {
    console.log(`[provision] ~ đã tồn tại: ${maskId(identifier)} (không đổi mật khẩu)`);
  } else {
    const { data, error } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName, login_identifier: identifier, must_change_password: true },
    });
    if (error) throw error;
    user = data.user;
    console.log(`[provision] + tạo tài khoản: ${maskId(identifier)}`);
  }

  const { error: pErr } = await admin.from("profiles").upsert(
    {
      auth_user_id: user.id,
      role: "SECRETARY",
      staff_title: staffTitle,
      full_name: fullName,
      email,
      phone,
      active: true,
    },
    { onConflict: "auth_user_id" },
  );
  if (pErr) throw pErr;
  console.log(`[provision]   hồ sơ ok: role=SECRETARY · ${staffTitle} · chưa phân công Khu phố`);
}

try {
  console.log(`[provision] Target: ${new URL(url).host} · ${accounts.length} tài khoản`);
  for (const acc of accounts) {
    await ensureSecretary(acc);
  }
  console.log("[provision] Xong. Tài khoản bị ép đổi mật khẩu lần đầu. Admin hãy phân công Khu phố.");
} catch (err) {
  console.error("[provision] LỖI:", String(err.message ?? err).replace(/(sb_secret_|sbp_|AIza)[A-Za-z0-9_-]+/g, "[secret]"));
  process.exit(1);
}
