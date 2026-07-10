/**
 * E2E route ảnh AI qua HTTP + COOKIE THẬT (09G). SERVER/LOCAL ONLY.
 *
 * Khác 09F (chỉ test gate RLS): script này GỌI HTTP THẬT tới app route với cookie phiên
 * của từng vai trò, assert status + header + audit đúng như trình duyệt.
 *
 * Cookie xây theo đúng format @supabase/ssr v0.12 (đã kiểm trong node_modules):
 *   name  = `sb-<project-ref>-auth-token`   (ref = hostname.split('.')[0])
 *   value = `base64-` + base64url(JSON.stringify(session))
 *   chunk = tách `.0/.1` khi > 3180 ký tự (như createChunks); vừa 1 chunk → giữ tên gốc.
 *
 * Seed fixtures prefix SMOKE_09G_: 2 Khu phố, Admin, Secretary đúng/sai scope, Parent,
 * 1 lô AI, 1 uploaded_documents, 1 ảnh 1x1 PNG (không PII) trong bucket private.
 *
 * KHÔNG in cookie/JWT/mật khẩu/secret/path. Cleanup sạch (audit append-only giữ lại, ghi rõ).
 *
 * Chạy (BẮT BUỘC có app đang chạy):
 *   E2E_BASE_URL=http://localhost:3000 node --env-file=.env.local scripts/e2e-ai-image-route-http-smoke.mjs
 *   hoặc E2E_BASE_URL=https://<preview-or-prod> ...
 */
import { createClient } from "@supabase/supabase-js";
import { randomBytes, randomUUID, createHash } from "node:crypto";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const anonKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const baseUrl = (process.env.E2E_BASE_URL ?? "").replace(/\/+$/, "");

if (!url || !serviceKey || !anonKey) {
  console.error("BLOCKED: thiếu NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY / publishable key.");
  process.exit(1);
}
if (!baseUrl) {
  console.log("PASS WITH WARNINGS: chưa set E2E_BASE_URL → KHÔNG chạy được HTTP smoke.");
  console.log("→ Chạy app (npm run dev) rồi: E2E_BASE_URL=http://localhost:3000 node --env-file=.env.local scripts/e2e-ai-image-route-http-smoke.mjs");
  process.exit(0);
}

const BUCKET = "ai-import-uploads";
const P = "SMOKE_09G_";
const REF = new URL(url).hostname.split(".")[0];
const COOKIE = `sb-${REF}-auth-token`;
const MAX_CHUNK = 3180;
const svc = createClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } });
const pass = () => "Sh" + randomBytes(12).toString("base64url"); // KHÔNG in

const PNG_1x1 = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
  "base64",
);

const created = { authIds: [], profileIds: [], batchId: null, docId: null, path: null, nbIds: [] };
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

/** Xây Cookie header phiên theo format @supabase/ssr (base64url + chunk .0/.1). */
function sessionCookieHeader(session) {
  const encoded = "base64-" + Buffer.from(JSON.stringify(session), "utf8").toString("base64url");
  let parts;
  if (encoded.length <= MAX_CHUNK) {
    parts = [{ name: COOKIE, value: encoded }];
  } else {
    const chunks = [];
    let rest = encoded;
    while (rest.length > 0) { chunks.push(rest.slice(0, MAX_CHUNK)); rest = rest.slice(MAX_CHUNK); }
    parts = chunks.map((value, i) => ({ name: `${COOKIE}.${i}`, value }));
  }
  return parts.map((c) => `${c.name}=${c.value}`).join("; ");
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

async function sessionFor(user) {
  const c = createClient(url, anonKey, { auth: { persistSession: false } });
  const { data, error } = await c.auth.signInWithPassword({ email: user.email, password: user.password });
  if (error) throw error;
  return data.session;
}

async function callRoute(cookieHeader, { download } = {}) {
  const u = `${baseUrl}/user/secretary/import/${created.batchId}/documents/${created.docId}${download ? "?download=1" : ""}`;
  const headers = {};
  if (cookieHeader) headers.cookie = cookieHeader;
  const res = await fetch(u, { headers, redirect: "manual" });
  // Đọc body nhỏ để đảm bảo không rò path/bucket; KHÔNG in nội dung nhị phân.
  let bodyText = "";
  const ct = res.headers.get("content-type") ?? "";
  if (!ct.startsWith("image/")) {
    try { bodyText = await res.text(); } catch { bodyText = ""; }
  }
  return { res, bodyText };
}

function noPathLeak(text) {
  return !new RegExp(BUCKET).test(text) && !/\/\d{4}-\d{2}-\d{2}\//.test(text);
}

async function main() {
  console.log(`[e2e-http] Target app: ${baseUrl} · Supabase ${new URL(url).host} · fixtures ${P}`);

  // --- SEED ---
  const nbA = await svc.from("neighborhoods").upsert({ code: P + "A", name: P + "A", active: true }, { onConflict: "code" }).select("id").single();
  const nbB = await svc.from("neighborhoods").upsert({ code: P + "B", name: P + "B", active: true }, { onConflict: "code" }).select("id").single();
  created.nbIds.push(nbA.data.id, nbB.data.id);

  const secIn = await makeUser(P.toLowerCase() + "httpsecin", "SECRETARY", P + "SecIn");
  const secOut = await makeUser(P.toLowerCase() + "httpsecout", "SECRETARY", P + "SecOut");
  const parent = await makeUser(P.toLowerCase() + "httpparent", "PARENT", P + "Parent");
  const adminU = await makeUser(P.toLowerCase() + "httpadmin", "ADMIN", P + "Admin");

  await svc.from("secretary_neighborhoods").upsert({ secretary_id: secIn.profileId, neighborhood_id: nbA.data.id, assignment_role: "PRIMARY" }, { onConflict: "secretary_id,neighborhood_id" });
  await svc.from("secretary_neighborhoods").upsert({ secretary_id: secOut.profileId, neighborhood_id: nbB.data.id, assignment_role: "PRIMARY" }, { onConflict: "secretary_id,neighborhood_id" });

  const batch = await svc.from("import_batches").insert({
    file_name: P + "batch", source: "AI", status: "DRAFT", neighborhood_id: nbA.data.id, created_by: secIn.profileId,
  }).select("id").single();
  created.batchId = batch.data.id;

  const path = `${secIn.profileId}/2026-07-10/${batch.data.id}/${randomUUID()}.png`;
  const up = await svc.storage.from(BUCKET).upload(path, PNG_1x1, { contentType: "image/png", upsert: false });
  if (up.error) throw up.error;
  created.path = path;
  const doc = await svc.from("uploaded_documents").insert({
    bucket: BUCKET, path, mime_type: "image/png", size_bytes: PNG_1x1.length,
    sha256: createHash("sha256").update(PNG_1x1).digest("hex"),
    uploaded_by: secIn.profileId, import_batch_id: batch.data.id,
  }).select("id").single();
  created.docId = doc.data.id;
  console.log("[e2e-http] seed xong: 4 users · 2 KP · 1 lô AI · 1 ảnh. Gọi HTTP thật:");

  // Cookie phiên từng vai trò.
  const ckIn = sessionCookieHeader(await sessionFor(secIn));
  const ckOut = sessionCookieHeader(await sessionFor(secOut));
  const ckParent = sessionCookieHeader(await sessionFor(parent));
  const ckAdmin = sessionCookieHeader(await sessionFor(adminU));

  // 1) CHƯA đăng nhập → chặn (403 theo route, hoặc 307/302 nếu có middleware login).
  {
    const { res, bodyText } = await callRoute(null);
    const blocked = res.status === 401 || res.status === 403 || [301, 302, 303, 307, 308].includes(res.status);
    check(`Chưa đăng nhập → bị chặn (status ${res.status})`, blocked);
    check("Chưa đăng nhập → không rò bucket/path", noPathLeak(bodyText));
  }

  // 2) ADMIN inline → 200 + header ảnh đúng.
  {
    const { res } = await callRoute(ckAdmin);
    check(`ADMIN inline → 200 (status ${res.status})`, res.status === 200);
    check("ADMIN inline → Content-Type image/png", (res.headers.get("content-type") ?? "").startsWith("image/png"));
    check("ADMIN inline → Content-Disposition inline", /inline/i.test(res.headers.get("content-disposition") ?? ""));
    check("ADMIN inline → Cache-Control no-store", /no-store/i.test(res.headers.get("cache-control") ?? ""));
    check("ADMIN inline → X-Content-Type-Options nosniff", (res.headers.get("x-content-type-options") ?? "").toLowerCase() === "nosniff");
  }

  // 3) ADMIN download → 200 + attachment.
  {
    const { res } = await callRoute(ckAdmin, { download: true });
    check(`ADMIN download → 200 (status ${res.status})`, res.status === 200);
    check("ADMIN download → Content-Disposition attachment", /attachment/i.test(res.headers.get("content-disposition") ?? ""));
  }

  // 4) SECRETARY đúng scope → 200.
  {
    const { res } = await callRoute(ckIn);
    check(`SECRETARY đúng scope → 200 (status ${res.status})`, res.status === 200);
    check("SECRETARY đúng scope → nosniff + no-store", (res.headers.get("x-content-type-options") ?? "").toLowerCase() === "nosniff" && /no-store/i.test(res.headers.get("cache-control") ?? ""));
  }

  // 5) SECRETARY sai scope → 403/404 (RLS không thấy lô).
  {
    const { res, bodyText } = await callRoute(ckOut);
    check(`SECRETARY sai scope → 403/404 (status ${res.status})`, res.status === 403 || res.status === 404);
    check("SECRETARY sai scope → không rò bucket/path", noPathLeak(bodyText));
  }

  // 6) PARENT → 403/404.
  {
    const { res, bodyText } = await callRoute(ckParent);
    check(`PARENT → 403/404 (status ${res.status})`, res.status === 403 || res.status === 404);
    check("PARENT → không rò bucket/path", noPathLeak(bodyText));
  }

  // 7) Audit VIEW/DOWNLOAD (service role đọc, verify actor + không PII/path).
  const { data: audit } = await svc
    .from("audit_logs")
    .select("action, actor_id, detail")
    .in("action", ["VIEW_AI_IMPORT_IMAGE", "DOWNLOAD_AI_IMPORT_IMAGE"])
    .order("created_at", { ascending: false })
    .limit(20);
  const rows = (audit ?? []).filter((r) => r.detail?.includes(created.batchId));
  // Lọc theo actor Admin: SECRETARY đúng scope cũng tạo 1 VIEW (mới hơn) nên không thể lấy dòng đầu.
  const viewRow = rows.find((r) => r.action === "VIEW_AI_IMPORT_IMAGE" && r.actor_id === adminU.profileId);
  const dlRow = rows.find((r) => r.action === "DOWNLOAD_AI_IMPORT_IMAGE" && r.actor_id === adminU.profileId);
  const secViewRow = rows.find((r) => r.action === "VIEW_AI_IMPORT_IMAGE" && r.actor_id === secIn.profileId);
  check("Audit VIEW_AI_IMPORT_IMAGE được ghi (actor Admin)", Boolean(viewRow));
  check("Audit VIEW_AI_IMPORT_IMAGE được ghi (actor SECRETARY đúng scope)", Boolean(secViewRow));
  check("Audit DOWNLOAD_AI_IMPORT_IMAGE được ghi (actor Admin)", Boolean(dlRow));
  const auditNoLeak = rows.every((r) => !new RegExp(BUCKET).test(r.detail ?? "") && !/\/\d{4}-\d{2}-\d{2}\//.test(r.detail ?? ""));
  check("Audit detail KHÔNG chứa bucket/path/PII", auditNoLeak);
}

async function cleanup() {
  console.log("[e2e-http] cleanup fixtures…");
  try {
    if (created.batchId) await svc.from("uploaded_documents").delete().eq("import_batch_id", created.batchId);
    if (created.path) await svc.storage.from(BUCKET).remove([created.path]);
    for (const pid of created.profileIds) await svc.from("secretary_neighborhoods").delete().eq("secretary_id", pid);
    if (created.batchId) await svc.from("import_batches").delete().eq("id", created.batchId);
    for (const pid of created.profileIds) await svc.from("profiles").delete().eq("id", pid);
    for (const aid of created.authIds) await svc.auth.admin.deleteUser(aid);
    for (const nid of created.nbIds) await svc.from("neighborhoods").delete().eq("id", nid);
    console.log("[e2e-http] cleanup xong (users/KP/lô/ảnh SMOKE_09G_ đã xóa).");
    console.log("[e2e-http] LƯU Ý: audit_logs append-only → dòng VIEW/DOWNLOAD smoke GIỮ LẠI (không xóa theo policy).");
  } catch (e) {
    console.error("[e2e-http] cleanup lỗi (kiểm thủ công SMOKE_09G_):", safeMessage(e.message));
  }
}

try {
  await main();
} catch (e) {
  failed++;
  console.error("[e2e-http] LỖI:", safeMessage(e.message ?? e));
} finally {
  await cleanup();
}
console.log(`\n[e2e-http] KẾT QUẢ: ${passed} pass · ${failed} fail`);
process.exit(failed > 0 ? 1 : 0);
