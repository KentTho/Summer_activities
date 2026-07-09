/**
 * Monitoring nhẹ (09D): gọi `/api/health` production và kiểm tra tối thiểu.
 * KHÔNG cần secret. Output ngắn. Thoát ≠ 0 nếu không đạt (dùng cho cron/CI/uptime).
 *
 *   node scripts/check-production-health.mjs
 *   node scripts/check-production-health.mjs https://<domain>/api/health
 *   HEALTH_URL=https://<domain>/api/health node scripts/check-production-health.mjs
 */
const DEFAULT_URL = "https://summer-activities-theta.vercel.app/api/health";
const EXPECT_PHASE = "09f-admin-recovery-image-smoke";

const url = process.argv[2] || process.env.HEALTH_URL || DEFAULT_URL;
const safeUrl = (() => {
  try {
    const parsed = new URL(url);
    return `${parsed.origin}${parsed.pathname}`;
  } catch {
    return "[invalid-url]";
  }
})();

async function main() {
  let res;
  try {
    res = await fetch(url, { headers: { "Cache-Control": "no-cache" } });
  } catch (e) {
    const kind = e instanceof Error ? e.name : "FetchError";
    console.error(`FAIL: không gọi được ${safeUrl} (${kind})`);
    process.exit(1);
  }
  if (!res.ok) {
    console.error(`FAIL: HTTP ${res.status} từ ${safeUrl}`);
    process.exit(1);
  }
  let body;
  try {
    body = await res.json();
  } catch {
    console.error("FAIL: health không trả JSON hợp lệ.");
    process.exit(1);
  }

  const problems = [];
  if (body.status !== "ok") problems.push(`status=${body.status}`);
  if (body.phase !== EXPECT_PHASE) problems.push(`phase=${body.phase} (mong đợi ${EXPECT_PHASE})`);

  if (problems.length) {
    console.error(`FAIL: ${problems.join(" · ")}`);
    process.exit(1);
  }
  console.log(`OK: status=ok · phase=${body.phase} · ${new Date().toISOString()}`);
}

main();
