/**
 * Preflight check trước khi deploy (09A).
 *
 * Kiểm tra nhanh các rủi ro thường gặp — KHÔNG in bất kỳ secret nào ra màn hình.
 *   1) Không có tệp nhạy cảm/ignored bị git theo dõi (.env.local, .vercel, .next, supabase/.temp…).
 *   2) Không có GIÁ TRỊ secret (service role/AI key/DB password) rò rỉ trong tệp tracked.
 *   3) Không còn import `@/lib/mock` (đã dọn dead code ở 09A).
 *   4) Health route phase KHÔNG phải phase cũ.
 * In nhắc chạy lint/typecheck/build. Thoát mã ≠ 0 nếu có lỗi.
 *
 * Chạy: npm run preflight
 */
import { execSync } from "node:child_process";
import { readFileSync, existsSync } from "node:fs";

let failures = 0;
const fail = (msg) => {
  failures += 1;
  console.error(`  ✗ ${msg}`);
};
const ok = (msg) => console.log(`  ✓ ${msg}`);

function tracked() {
  return execSync("git ls-files", { encoding: "utf8" }).split(/\r?\n/).filter(Boolean);
}

const files = tracked();

// 1) Tệp nhạy cảm/ignored không được commit.
console.log("[1] Tệp nhạy cảm/ignored bị theo dõi:");
const forbidden = [/^\.env(\.local|\.production)?$/, /^\.vercel\//, /^\.next\//, /^supabase\/\.temp\//, /^supabase\/\.branches\//];
const badTracked = files.filter((f) => forbidden.some((re) => re.test(f)));
if (badTracked.length) badTracked.forEach((f) => fail(`đang commit tệp nhạy cảm: ${f}`));
else ok("không có .env.local/.vercel/.next/supabase/.temp trong git");

// 2) Rò rỉ giá trị secret (đọc .env.local ngoài git, so khớp trong tệp tracked).
console.log("[2] Rò rỉ giá trị secret trong tệp tracked:");
const secretValues = [];
if (existsSync(".env.local")) {
  for (const line of readFileSync(".env.local", "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/);
    if (!m) continue;
    const [, key, rawVal] = m;
    const val = rawVal.replace(/^["']|["']$/g, "").trim();
    // Bỏ qua khóa công khai, cấu hình không nhạy cảm (URL/provider/ngôn ngữ…),
    // giá trị quá ngắn hoặc là URL (endpoint công khai, không phải secret).
    if (key.startsWith("NEXT_PUBLIC_") || val.length < 12 || /^https?:\/\//.test(val)) continue;
    if (/_(URL|PROVIDER|LANGUAGE|ENGINE)$/.test(key)) continue;
    // Chỉ coi là secret khi tên khóa mang dấu hiệu bí mật thực sự.
    if (/SERVICE_ROLE_KEY|API_KEY|_SECRET|PASSWORD|_TOKEN|PRIVATE_KEY/.test(key)) {
      secretValues.push({ key, val });
    }
  }
}
const skipExt = /\.(png|jpe?g|gif|webp|svg|ico|pdf|docx|woff2?|ttf)$/i;
let leaks = 0;
for (const f of files) {
  if (skipExt.test(f)) continue;
  let content;
  try {
    content = readFileSync(f, "utf8");
  } catch {
    continue;
  }
  for (const s of secretValues) {
    if (content.includes(s.val)) {
      fail(`giá trị của ${s.key} xuất hiện trong ${f}`);
      leaks += 1;
    }
  }
}
if (secretValues.length === 0) ok("(.env.local không có/không đọc được — bỏ qua so khớp)");
else if (leaks === 0) ok(`không rò rỉ ${secretValues.length} secret đã kiểm`);

// 3) Không còn import mock dead code.
console.log("[3] Import mock dead code:");
let mockImports = 0;
for (const f of files) {
  if (!/^src\/.*\.(ts|tsx)$/.test(f)) continue;
  const content = readFileSync(f, "utf8");
  if (/from\s+["']@\/lib\/mock|from\s+["'].*\/lib\/mock/.test(content)) {
    fail(`còn import mock trong ${f}`);
    mockImports += 1;
  }
}
if (mockImports === 0) ok("không còn import @/lib/mock");

// 4) Health phase không phải phase cũ.
console.log("[4] Health route phase:");
const OLD_PHASES = [
  "5-db-schema-rls",
  "08c-docx-export-admin-hardening",
  "09a-production-hardening",
  "09b-gemini-ai-import",
  "09c-ai-import-hardening",
  "09d-ai-import-evidence-monitoring",
  "09e-password-requests-real-smoke",
  "09f-admin-recovery-image-smoke",
  "09g-e2e-image-admin-assignment",
];
const healthPath = "src/app/api/health/route.ts";
if (existsSync(healthPath)) {
  const content = readFileSync(healthPath, "utf8");
  const phaseMatch = content.match(/phase:\s*["']([^"']+)["']/);
  const phase = phaseMatch?.[1] ?? "";
  if (!phase) fail("không tìm thấy phase trong health route");
  else if (OLD_PHASES.includes(phase)) fail(`health phase còn là phase cũ: ${phase}`);
  else ok(`health phase = ${phase}`);
} else {
  fail("thiếu health route");
}

console.log("\nNhắc: chạy `npm run lint && npm run typecheck && npm run build` trước khi deploy.");

if (failures > 0) {
  console.error(`\nPREFLIGHT FAILED: ${failures} vấn đề.`);
  process.exit(1);
}
console.log("\nPREFLIGHT OK.");
