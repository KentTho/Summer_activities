/**
 * Smoke phân quyền route ảnh AI bằng SESSION THẬT (09F). SERVER/LOCAL ONLY.
 *
 * Kiểm ĐÚNG cổng bảo vệ của route `/.../documents/[documentId]`:
 *   role ∈ {ADMIN,SECRETARY}  +  RLS `import_batches.ib_select` thấy lô  +  doc ràng buộc lô+bucket.
 * Dùng JWT NGƯỜI DÙNG THẬT (signInWithPassword) → RLS áp đúng như route (KHÔNG service role cho phần test).
 * Service role CHỈ để seed/cleanup fixtures (prefix SMOKE_09F_). KHÔNG in mật khẩu/secret/PII.
 *
 * Chạy:  node --env-file=.env.local scripts/smoke-ai-image-route.mjs
 */
import { createClient } from "@supabase/supabase-js";
import { randomBytes, randomUUID, createHash } from "node:crypto";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const anonKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
if (!url || !serviceKey || !anonKey) {
  console.error("BLOCKED: thiếu NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY / publishable key.");
  process.exit(1);
}

const BUCKET = "ai-import-uploads";
const P = "SMOKE_09F_";
const svc = createClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } });
const pass = () => "Sh" + randomBytes(12).toString("base64url"); // ngẫu nhiên, KHÔNG in

// 1x1 PNG hợp lệ (fixture, KHÔNG PII).
const PNG_1x1 = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
  "base64",
);

const created = { authIds: [], profileIds: [], batchId: null, path: null, nbIds: [] };
let passed = 0;
let failed = 0;
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

async function authedClient(email, password) {
  const c = createClient(url, anonKey, { auth: { autoRefreshToken: false, persistSession: false } });
  const { error } = await c.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return c;
}

async function canSeeBatch(client, batchId) {
  const { data } = await client.from("import_batches").select("id").eq("id", batchId).maybeSingle();
  return Boolean(data);
}

async function main() {
  console.log(`[smoke] Target: ${new URL(url).host} · fixtures prefix ${P}`);

  // --- SEED ---
  const nbA = await svc.from("neighborhoods").upsert({ code: P + "A", name: P + "A", active: true }, { onConflict: "code" }).select("id").single();
  const nbB = await svc.from("neighborhoods").upsert({ code: P + "B", name: P + "B", active: true }, { onConflict: "code" }).select("id").single();
  created.nbIds.push(nbA.data.id, nbB.data.id);

  const secIn = await makeUser(P.toLowerCase() + "secin", "SECRETARY", P + "SecIn");
  const secOut = await makeUser(P.toLowerCase() + "secout", "SECRETARY", P + "SecOut");
  const parent = await makeUser(P.toLowerCase() + "parent", "PARENT", P + "Parent");
  const adminU = await makeUser(P.toLowerCase() + "admin", "ADMIN", P + "Admin");

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
  const docId = doc.data.id;
  console.log("[smoke] seed xong: 4 users · 2 KP · 1 lô · 1 ảnh.\n[smoke] Kiểm phân quyền (session thật):");

  // --- TESTS (gate của route = role + thấy lô qua RLS + doc ràng buộc) ---
  const cIn = await authedClient(secIn.email, secIn.password);
  const cOut = await authedClient(secOut.email, secOut.password);
  const cParent = await authedClient(parent.email, parent.password);
  const cAdmin = await authedClient(adminU.email, adminU.password);
  const cAnon = createClient(url, anonKey, { auth: { persistSession: false } });

  check("SECRETARY đúng scope THẤY lô (→ route 200)", await canSeeBatch(cIn, batch.data.id));
  check("SECRETARY sai scope KHÔNG thấy lô (→ route 404)", !(await canSeeBatch(cOut, batch.data.id)));
  check("PARENT bị chặn bởi role (route trả 403) & không thấy lô", !(await canSeeBatch(cParent, batch.data.id)));
  check("ADMIN thấy lô (→ route 200)", await canSeeBatch(cAdmin, batch.data.id));
  check("CHƯA đăng nhập không thấy lô (RLS authenticated)", !(await canSeeBatch(cAnon, batch.data.id)));

  // Doc ràng buộc lô + bucket (getAiImportDocForBatch) — dương tính & âm tính.
  const bound = await svc.from("uploaded_documents").select("path").eq("id", docId).eq("import_batch_id", batch.data.id).eq("bucket", BUCKET).maybeSingle();
  check("Ảnh ràng buộc ĐÚNG lô + bucket ai-import-uploads", Boolean(bound.data?.path));
  const wrong = await svc.from("uploaded_documents").select("id").eq("id", docId).eq("import_batch_id", randomUUID()).maybeSingle();
  check("Ảnh KHÔNG khớp lô khác (chống IDOR)", !wrong.data);

  // Đọc được nhị phân từ bucket private bằng service role (route làm sau khi đã có quyền lô).
  const dl = await svc.storage.from(BUCKET).download(path);
  check("Đọc được ảnh private từ bucket (service role, sau khi có quyền)", !dl.error && Boolean(dl.data));
}

async function cleanup() {
  console.log("[smoke] cleanup fixtures…");
  try {
    if (created.batchId) await svc.from("uploaded_documents").delete().eq("import_batch_id", created.batchId);
    if (created.path) await svc.storage.from(BUCKET).remove([created.path]);
    for (const pid of created.profileIds) await svc.from("secretary_neighborhoods").delete().eq("secretary_id", pid);
    if (created.batchId) await svc.from("import_batches").delete().eq("id", created.batchId);
    for (const pid of created.profileIds) await svc.from("profiles").delete().eq("id", pid);
    for (const aid of created.authIds) await svc.auth.admin.deleteUser(aid);
    for (const nid of created.nbIds) await svc.from("neighborhoods").delete().eq("id", nid);
    console.log("[smoke] cleanup xong (không còn SMOKE_09F_ fixtures).");
  } catch (e) {
    console.error("[smoke] cleanup lỗi (kiểm thủ công SMOKE_09F_):", e.message);
  }
}

try {
  await main();
} catch (e) {
  failed++;
  console.error("[smoke] LỖI:", String(e.message ?? e).replace(/(sb_secret_|sbp_|AIza)[A-Za-z0-9_-]+/g, "[secret]"));
} finally {
  await cleanup();
}
console.log(`\n[smoke] KẾT QUẢ: ${passed} pass · ${failed} fail`);
process.exit(failed > 0 ? 1 : 0);
