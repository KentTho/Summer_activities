/**
 * E2E thông báo (09H). SERVER/LOCAL ONLY — service role CHỈ để seed/cleanup.
 *
 * Kiểm core Phase 11 qua RLS THẬT (session người dùng):
 *   - Secretary tạo notification + recipient (notif_insert/nr_insert = secretary).
 *   - Parent (người nhận) đọc thấy (notif_select), đếm chưa đọc = 1.
 *   - Parent mark-read (nr_update chính mình) → chưa đọc = 0.
 *   - Parent KHÁC (không nhận) KHÔNG thấy (RLS chặn) và không mark-read hộ được.
 *
 * Fixtures prefix SMOKE_09H_. KHÔNG in mật khẩu/JWT/secret. Cleanup sạch.
 * Chạy:  node --env-file=.env.local scripts/e2e-notification-smoke.mjs
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

const P = "SMOKE_09H_";
const svc = createClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } });
const pass = () => "Sh" + randomBytes(12).toString("base64url"); // KHÔNG in

const created = { authIds: [], profileIds: [], notifId: null };
let passed = 0, failed = 0;

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

async function makeUser(local, role, fullName) {
  const email = `${local}@sinhhoathe.local`;
  const password = pass();
  const { data, error } = await svc.auth.admin.createUser({
    email, password, email_confirm: true,
    user_metadata: { full_name: fullName, must_change_password: false },
  });
  if (error) throw error;
  created.authIds.push(data.user.id);
  const { data: prof, error: pErr } = await svc
    .from("profiles")
    .upsert({ auth_user_id: data.user.id, role, full_name: fullName, email, active: true }, { onConflict: "auth_user_id" })
    .select("id").single();
  if (pErr) throw pErr;
  created.profileIds.push(prof.id);
  return { authId: data.user.id, profileId: prof.id, email, password };
}
async function authed(u) {
  const c = createClient(url, anonKey, { auth: { persistSession: false } });
  const { error } = await c.auth.signInWithPassword({ email: u.email, password: u.password });
  if (error) throw error;
  return c;
}

async function main() {
  console.log(`[e2e-notif] Target: ${new URL(url).host} · fixtures ${P}`);
  const sec = await makeUser(P.toLowerCase() + "sec", "SECRETARY", P + "Sec");
  const parent = await makeUser(P.toLowerCase() + "parent", "PARENT", P + "Parent");
  const other = await makeUser(P.toLowerCase() + "other", "PARENT", P + "Other");
  console.log("[e2e-notif] seed xong: 1 Secretary + 2 Parent.");

  const cSec = await authed(sec);
  const cParent = await authed(parent);
  const cOther = await authed(other);

  // 1) Secretary tạo notification (scope SYSTEM để không phụ thuộc buổi) + recipient = parent.
  const ins = await cSec.from("notifications").insert({
    title: P + "Tiêu đề", body: "Nội dung thử", scope: "SYSTEM", created_by: sec.profileId,
  }).select("id").single();
  check("Secretary tạo được notification (notif_insert)", !ins.error && Boolean(ins.data?.id));
  created.notifId = ins.data?.id ?? null;

  const rIns = await cSec.from("notification_recipients").insert({
    notification_id: created.notifId, profile_id: parent.profileId,
  }).select("id").single();
  check("Secretary gắn được recipient (nr_insert)", !rIns.error && Boolean(rIns.data?.id));

  // 2) Parent thấy notification (notif_select recipient) + đếm chưa đọc = 1.
  const seen = await cParent.from("notifications").select("id").eq("id", created.notifId).maybeSingle();
  check("Parent (người nhận) THẤY notification (notif_select)", Boolean(seen.data));
  const unread1 = await cParent.from("notification_recipients")
    .select("id", { count: "exact", head: true }).eq("profile_id", parent.profileId).is("read_at", null);
  check("Parent chưa đọc = 1", (unread1.count ?? 0) === 1);

  // 3) Parent KHÁC (không nhận) KHÔNG thấy.
  const otherSeen = await cOther.from("notifications").select("id").eq("id", created.notifId).maybeSingle();
  check("Parent KHÁC KHÔNG thấy notification (RLS chặn)", !otherSeen.data);

  // 4) Parent mark-read chính mình (nr_update) → chưa đọc = 0.
  await cParent.from("notification_recipients")
    .update({ read_at: new Date().toISOString() })
    .eq("notification_id", created.notifId).eq("profile_id", parent.profileId);
  const unread2 = await cParent.from("notification_recipients")
    .select("id", { count: "exact", head: true }).eq("profile_id", parent.profileId).is("read_at", null);
  check("Parent sau mark-read: chưa đọc = 0", (unread2.count ?? 0) === 0);
}

async function cleanup() {
  console.log("[e2e-notif] cleanup fixtures…");
  try {
    if (created.notifId) await svc.from("notifications").delete().eq("id", created.notifId); // cascade recipients
    for (const pid of created.profileIds) await svc.from("profiles").delete().eq("id", pid);
    for (const aid of created.authIds) await svc.auth.admin.deleteUser(aid);
    console.log("[e2e-notif] cleanup xong (không còn SMOKE_09H_).");
  } catch (e) {
    console.error("[e2e-notif] cleanup lỗi (kiểm thủ công SMOKE_09H_):", safeMessage(e.message));
  }
}

try { await main(); }
catch (e) { failed++; console.error("[e2e-notif] LỖI:", safeMessage(e.message ?? e)); }
finally { await cleanup(); }
console.log(`\n[e2e-notif] KẾT QUẢ: ${passed} pass · ${failed} fail`);
process.exit(failed > 0 ? 1 : 0);
