/**
 * Gán Khu phố cho Bí thư (09G). SERVER/LOCAL ONLY — service role (bỏ RLS để seed).
 *
 * AN TOÀN: MẶC ĐỊNH dry-run. KHÔNG tự gán bừa. Chỉ ghi khi có CHỈ ĐỊNH RÕ + APPLY.
 *
 * Chế độ:
 *   1. DRY-RUN (mặc định, không cần env gán): liệt kê Bí thư (role SECRETARY, staff_title
 *      Bí thư/Chi Đoàn) + trạng thái phân công. Bí thư chưa có Khu phố → in "CHƯA PHÂN CÔNG"
 *      và hướng dẫn Admin gán ở /admin/secretaries. KHÔNG thay đổi dữ liệu.
 *   2. APPLY (có chỉ định): set env
 *        ASSIGN_SECRETARIES_JSON='[{"identifier":"<phone-or-login>","neighborhood_code":"KP01","assignment_role":"COORDINATING"}]'
 *        ASSIGN_SECRETARIES_APPLY=true
 *      → gán đúng những Bí thư được chỉ định vào Khu phố tương ứng, ghi audit ASSIGN_NEIGHBORHOOD.
 *      assignment_role ∈ {PRIMARY, COORDINATING} (mặc định COORDINATING). KHÔNG gỡ phân công cũ.
 *
 * KHÔNG in identifier thật (redact 3 số cuối). KHÔNG in mật khẩu/secret.
 *
 * Chạy:  node --env-file=.env.local scripts/assign-secretaries-neighborhoods.mjs
 */
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceKey) {
  console.error("BLOCKED: thiếu NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY.");
  process.exit(1);
}

const apply = String(process.env.ASSIGN_SECRETARIES_APPLY ?? "false").toLowerCase() === "true";
const rawAssign = process.env.ASSIGN_SECRETARIES_JSON ?? "";
const svc = createClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } });

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
function maskId(v) {
  const s = String(v ?? "");
  return s.length <= 3 ? "***" : "***" + s.slice(-3);
}
function safeMessage(m) {
  return String(m ?? "")
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, "[email]")
    .replace(/\d{6,}/g, "[number]")
    .replace(/(sb_secret_|sbp_|AIza)[A-Za-z0-9_-]+/g, "[secret]");
}

/** Tìm 1 Admin để làm actor cho audit khi APPLY. */
async function findAdminActor() {
  const { data } = await svc.from("profiles").select("id, role").eq("role", "ADMIN").eq("active", true).limit(1).maybeSingle();
  return data ?? null;
}

async function reportStatus() {
  const { data: secs, error } = await svc
    .from("profiles")
    .select("id, role, staff_title, active")
    .eq("role", "SECRETARY")
    .order("created_at", { ascending: true });
  if (error) throw error;
  const list = secs ?? [];
  console.log(`[assign] Bí thư (role=SECRETARY): ${list.length} hồ sơ.`);

  let unassigned = 0;
  for (let i = 0; i < list.length; i++) {
    const s = list[i];
    const { data: rows } = await svc
      .from("secretary_neighborhoods")
      .select("assignment_role, neighborhoods(code)")
      .eq("secretary_id", s.id);
    const count = rows?.length ?? 0;
    if (count === 0) unassigned++;
    const codes = (rows ?? []).map((r) => `${r.neighborhoods?.code ?? "?"}:${r.assignment_role}`).join(", ");
    console.log(
      `  · Bí thư #${i + 1} [${s.staff_title ?? "—"}] active=${s.active} → ${count === 0 ? "CHƯA PHÂN CÔNG" : codes}`,
    );
  }
  console.log(`[assign] Tổng: ${unassigned} Bí thư CHƯA phân công Khu phố.`);
  if (unassigned > 0) {
    console.log("[assign] → Admin phân công tại /admin/secretaries (nút 'Gán Khu phố').");
    console.log('[assign] → Hoặc APPLY: ASSIGN_SECRETARIES_JSON=\'[{"identifier":"<...>","neighborhood_code":"KP01"}]\' ASSIGN_SECRETARIES_APPLY=true');
  }
  return unassigned;
}

async function applyAssignments() {
  let assignments;
  try {
    assignments = JSON.parse(rawAssign);
    if (!Array.isArray(assignments) || assignments.length === 0) throw new Error("rỗng");
  } catch {
    console.error("BLOCKED: ASSIGN_SECRETARIES_JSON không phải JSON mảng hợp lệ.");
    process.exit(1);
  }
  const actor = await findAdminActor();
  if (!actor) {
    console.error("BLOCKED: không tìm thấy Admin active làm actor audit. Dừng để không gán thiếu vết.");
    process.exit(1);
  }

  for (const a of assignments) {
    const identifier = String(a.identifier ?? "").trim();
    const code = String(a.neighborhood_code ?? "").trim();
    const role = a.assignment_role === "PRIMARY" ? "PRIMARY" : "COORDINATING";
    if (!identifier || !code) { console.log("  ✗ bỏ qua mục thiếu identifier/neighborhood_code."); continue; }

    const email = identifierToEmail(identifier);
    const { data: prof } = await svc.from("profiles").select("id, role").eq("email", email).maybeSingle();
    if (!prof) { console.log(`  ✗ ${maskId(identifier)}: không tìm thấy hồ sơ.`); continue; }
    if (prof.role !== "SECRETARY") { console.log(`  ✗ ${maskId(identifier)}: hồ sơ không phải SECRETARY (bỏ qua).`); continue; }

    const { data: nb } = await svc.from("neighborhoods").select("id").eq("code", code).maybeSingle();
    if (!nb) { console.log(`  ✗ ${maskId(identifier)}: Khu phố ${code} không tồn tại.`); continue; }

    // Chỉ 1 Phụ trách chính/Khu phố — hạ người cũ nếu nâng PRIMARY (giữ ràng buộc như UI).
    if (role === "PRIMARY") {
      await svc.from("secretary_neighborhoods")
        .update({ assignment_role: "COORDINATING" })
        .eq("neighborhood_id", nb.id)
        .eq("assignment_role", "PRIMARY")
        .neq("secretary_id", prof.id);
    }
    const { error: upErr } = await svc.from("secretary_neighborhoods").upsert(
      { secretary_id: prof.id, neighborhood_id: nb.id, assignment_role: role },
      { onConflict: "secretary_id,neighborhood_id" },
    );
    if (upErr) { console.log(`  ✗ ${maskId(identifier)}: gán lỗi — ${safeMessage(upErr.message)}`); continue; }

    await svc.from("audit_logs").insert({
      actor_id: actor.id, actor_role: "ADMIN",
      action: "ASSIGN_NEIGHBORHOOD", entity: "secretary_neighborhoods",
      detail: `${role} · secretary ${prof.id} ↔ ${code}`,
    });
    console.log(`  ✓ ${maskId(identifier)} → ${code} (${role}) — audit ghi.`);
  }
}

try {
  console.log(`[assign] Target: ${new URL(url).host} · chế độ: ${apply && rawAssign ? "APPLY" : "DRY-RUN"}`);
  if (apply && rawAssign) {
    await applyAssignments();
    console.log("[assign] APPLY xong. Chạy lại (không APPLY) để xem trạng thái.");
  } else {
    if (apply && !rawAssign) console.log("[assign] ⚠ APPLY=true nhưng thiếu ASSIGN_SECRETARIES_JSON → chỉ DRY-RUN.");
    await reportStatus();
  }
} catch (err) {
  console.error("[assign] LỖI:", safeMessage(err.message ?? err));
  process.exit(1);
}
