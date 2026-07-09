/**
 * Retention cleanup ảnh AI import cũ (09D). Bucket PRIVATE `ai-import-uploads`.
 *
 * MẶC ĐỊNH DRY-RUN — chỉ thống kê, KHÔNG xóa. Muốn xóa thật phải thêm `--apply`.
 *   node scripts/cleanup-ai-import-images.mjs --days=90          # dry-run
 *   node scripts/cleanup-ai-import-images.mjs --days=90 --apply  # xóa thật
 * Cần env local:
 *   node --env-file=.env.local scripts/cleanup-ai-import-images.mjs --days=90
 *
 * An toàn:
 *  - Chỉ xử lý bucket `ai-import-uploads`. KHÔNG đụng import batch/rows/students.
 *  - Xóa nhị phân Storage + hàng metadata `uploaded_documents` (import_batch_id FK
 *    on delete set null — không phá lô).
 *  - KHÔNG in path đầy đủ (chứa profile id) — chỉ in count/size/bucket/ngày.
 *  - Thiếu service role ⇒ báo BLOCKED, KHÔNG crash.
 */
import { readFileSync, existsSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

const BUCKET = "ai-import-uploads";

// --- args ---
const args = process.argv.slice(2);
const apply = args.includes("--apply");
const daysArg = args.find((a) => a.startsWith("--days="));
const days = Math.max(1, Number(daysArg?.split("=")[1] ?? "90") || 90);

// --- env (process.env + .env.local nếu có; KHÔNG in giá trị) ---
function loadEnvLocal() {
  if (existsSync(".env.local")) {
    for (const line of readFileSync(".env.local", "utf8").split(/\r?\n/)) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/);
      if (!m) continue;
      const [, key, rawVal] = m;
      if (process.env[key] == null) process.env[key] = rawVal.replace(/^["']|["']$/g, "").trim();
    }
  }
}
loadEnvLocal();

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceKey) {
  console.error("BLOCKED: thiếu NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY.");
  console.error("Chạy: node --env-file=.env.local scripts/cleanup-ai-import-images.mjs --days=" + days);
  process.exit(1);
}

const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
const admin = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function main() {
  console.log(`[cleanup] bucket=${BUCKET} · giữ lại ${days} ngày · cắt trước ${cutoff.toISOString().slice(0, 10)} · mode=${apply ? "APPLY" : "DRY-RUN"}`);

  const { data: docs, error } = await admin
    .from("uploaded_documents")
    .select("id, path, size_bytes, created_at")
    .eq("bucket", BUCKET)
    .lt("created_at", cutoff.toISOString());
  if (error) {
    console.error("BLOCKED: không đọc được uploaded_documents:", error.message);
    process.exit(1);
  }

  const targets = docs ?? [];
  const totalBytes = targets.reduce((s, d) => s + (d.size_bytes ?? 0), 0);
  const oldest = targets.reduce((min, d) => (d.created_at < min ? d.created_at : min), "9999");
  console.log(`[cleanup] ứng viên: ${targets.length} ảnh · ~${Math.round(totalBytes / 1024)}KB${targets.length ? ` · cũ nhất ${oldest.slice(0, 10)}` : ""}`);

  if (targets.length === 0) {
    console.log("[cleanup] Không có ảnh nào quá hạn. Xong.");
    return;
  }
  if (!apply) {
    console.log("[cleanup] DRY-RUN — không xóa gì. Thêm --apply để xóa thật.");
    return;
  }

  // APPLY: xóa nhị phân Storage theo lô, rồi xóa metadata các hàng đã xử lý.
  let removedStorage = 0;
  let removedRows = 0;
  const CHUNK = 100;
  for (let i = 0; i < targets.length; i += CHUNK) {
    const chunk = targets.slice(i, i + CHUNK);
    const paths = chunk.map((d) => d.path).filter(Boolean);
    if (paths.length) {
      const { error: rmErr } = await admin.storage.from(BUCKET).remove(paths);
      if (rmErr) {
        console.error(`[cleanup] lỗi xóa storage lô ${i / CHUNK + 1}: ${rmErr.message}`);
        continue; // giữ metadata để retry lần sau — không mồ côi
      }
      removedStorage += paths.length;
    }
    const ids = chunk.map((d) => d.id);
    const { error: delErr } = await admin.from("uploaded_documents").delete().in("id", ids);
    if (delErr) console.error(`[cleanup] lỗi xóa metadata lô ${i / CHUNK + 1}: ${delErr.message}`);
    else removedRows += ids.length;
  }

  console.log(`[cleanup] Đã xóa: ${removedStorage} ảnh storage · ${removedRows} hàng metadata. Không đụng lô/dòng/học sinh.`);
}

main().catch((e) => {
  console.error("[cleanup] lỗi:", e.message);
  process.exit(1);
});
