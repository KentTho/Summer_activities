/**
 * Khôi phục tài khoản ADMIN gốc (break-glass). SERVER/LOCAL ONLY — service role, bỏ RLS.
 *
 * ⚠️ KHÔNG hardcode mật khẩu. KHÔNG in mật khẩu/secret. KHÔNG import ở client.
 * Không thể XEM mật khẩu cũ (đã hash) — chỉ ĐẶT LẠI mật khẩu mới.
 *
 * Env runtime:
 *   ADMIN_RECOVERY_IDENTIFIER   (mặc định "Admin") — tài khoản/định danh Admin.
 *   ADMIN_RECOVERY_PASSWORD     — mật khẩu MỚI. KHÔNG set ⇒ chỉ CHẨN ĐOÁN (không đổi gì).
 *   ADMIN_RECOVERY_FORCE_CHANGE (mặc định "false") — true ⇒ ép đổi mật khẩu lần đầu.
 *
 * Cách chạy:
 *   node --env-file=.env.local scripts/recover-admin-account.mjs                 # chẩn đoán
 *   ADMIN_RECOVERY_PASSWORD='***' node --env-file=.env.local scripts/recover-admin-account.mjs   # đặt lại
 */
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceKey) {
  console.error("BLOCKED: thiếu NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY.");
  console.error("Cần set trong .env.local (KHÔNG commit). Chạy: node --env-file=.env.local scripts/recover-admin-account.mjs");
  process.exit(1);
}

const identifier = (process.env.ADMIN_RECOVERY_IDENTIFIER ?? "Admin").trim();
const newPassword = process.env.ADMIN_RECOVERY_PASSWORD ?? "";
const forceChange = String(process.env.ADMIN_RECOVERY_FORCE_CHANGE ?? "false").toLowerCase() === "true";
const diagnoseOnly = newPassword.length === 0;

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

async function main() {
  const email = identifierToEmail(identifier);
  console.log(`[recover] Target: ${new URL(url).host} · identifier="${identifier}" · email=${email}`);
  console.log(`[recover] Chế độ: ${diagnoseOnly ? "CHẨN ĐOÁN (không đổi gì)" : "ĐẶT LẠI MẬT KHẨU"} · force_change=${forceChange}`);

  const user = await findUserByEmail(email);
  if (!user) {
    console.log("[recover] ✗ KHÔNG tìm thấy auth user cho identifier này.");
    console.log("[recover]   → Dùng bootstrap tạo Admin, hoặc kiểm tra lại identifier.");
    if (diagnoseOnly) return;
    console.log("[recover] Không đặt lại vì auth user không tồn tại.");
    return;
  }

  const mustChange = user.user_metadata?.must_change_password === true;
  const { data: prof } = await admin
    .from("profiles")
    .select("id, role, active")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  console.log(`[recover] auth user: có · email_confirmed=${Boolean(user.email_confirmed_at)} · must_change_password=${mustChange}`);
  console.log(`[recover] profile: ${prof ? `role=${prof.role} · active=${prof.active}` : "KHÔNG có hồ sơ"}`);

  // Chẩn đoán nguyên nhân thường gặp.
  const issues = [];
  if (!prof) issues.push("thiếu hồ sơ ADMIN (login sẽ bị đăng xuất)");
  if (prof && prof.role !== "ADMIN") issues.push(`role không phải ADMIN (đang ${prof.role})`);
  if (prof && prof.active === false) issues.push("hồ sơ bị khóa (active=false)");
  if (mustChange) issues.push("bị ép đổi mật khẩu (đăng nhập xong vào /change-password)");
  console.log(`[recover] Chẩn đoán: ${issues.length ? issues.join(" · ") : "không thấy vấn đề rõ ràng (có thể sai mật khẩu)"}`);

  if (diagnoseOnly) {
    console.log("[recover] Chỉ chẩn đoán. Để ĐẶT LẠI mật khẩu: set ADMIN_RECOVERY_PASSWORD rồi chạy lại.");
    return;
  }

  // ĐẶT LẠI: mật khẩu mới + đảm bảo profile ADMIN active + cờ must_change_password theo env.
  const { error: upErr } = await admin.auth.admin.updateUserById(user.id, {
    password: newPassword,
    email_confirm: true,
    user_metadata: { ...user.user_metadata, must_change_password: forceChange },
  });
  if (upErr) throw upErr;

  const { error: pErr } = await admin.from("profiles").upsert(
    {
      auth_user_id: user.id,
      role: "ADMIN",
      full_name: prof?.role === "ADMIN" ? undefined : (user.user_metadata?.full_name ?? "Quản trị viên"),
      email,
      active: true,
    },
    { onConflict: "auth_user_id" },
  );
  if (pErr) throw pErr;

  console.log("[recover] ✓ Đã đặt lại mật khẩu Admin + đảm bảo role ADMIN, active=true.");
  console.log(`[recover]   must_change_password=${forceChange}${forceChange ? " (đăng nhập xong sẽ vào /change-password)" : " (đăng nhập thẳng vào /admin)"}`);
  console.log("[recover] KHÔNG in mật khẩu. Đăng nhập cổng Quản trị bằng mật khẩu vừa đặt.");
}

main().catch((err) => {
  const msg = String(err.message ?? err).replace(/(sb_secret_|sbp_|AIza)[A-Za-z0-9_-]+/g, "[secret]");
  console.error("[recover] LỖI:", msg);
  process.exit(1);
});
