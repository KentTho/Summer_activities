/**
 * Smoke tách cổng Admin/User (10C). Chỉ gọi HTTP công khai — KHÔNG cần secret.
 *
 * Kiểm:
 *  - GET `/`            : 200, HTML KHÔNG chứa link `/admin`.
 *  - GET `/gioi-thieu`  : 200, HTML KHÔNG chứa link `/admin`.
 *  - GET `/user/login`  : 200, HTML KHÔNG chứa `/admin`.
 *  - GET `/admin/login` : 200 (Admin vẫn vào bằng URL trực tiếp).
 *  - GET `/admin`       : chưa login → redirect (3xx) về `/admin/login`.
 *  - GET `/user/secretary` : chưa login → redirect (3xx) về `/user/login`.
 *
 * Chạy:  E2E_BASE_URL=https://<host> node scripts/smoke-portal-separation.mjs
 *        (mặc định production nếu không set)
 */
const BASE =
  (process.env.E2E_BASE_URL ?? "https://summer-activities-theta.vercel.app").replace(/\/+$/, "");

let passed = 0;
let failed = 0;
function check(name, cond) {
  if (cond) { passed++; console.log(`  ✓ ${name}`); }
  else { failed++; console.log(`  ✗ ${name}`); }
}

/** Chỉ bắt LINK tới admin (href="/admin..."), bỏ qua text thường. */
function hasAdminLink(html) {
  return /href\s*=\s*["'`]\/admin/i.test(html) || /\/admin\/login/i.test(html);
}

async function getText(path) {
  const res = await fetch(`${BASE}${path}`, { redirect: "manual" });
  let body = "";
  try { body = await res.text(); } catch { body = ""; }
  return { res, body };
}

async function main() {
  console.log(`[portal] Target: ${BASE}`);

  const home = await getText("/");
  check("GET / = 200", home.res.status === 200);
  check("/ KHÔNG có link /admin", !hasAdminLink(home.body));

  const about = await getText("/gioi-thieu");
  check("GET /gioi-thieu = 200", about.res.status === 200);
  check("/gioi-thieu KHÔNG có link /admin", !hasAdminLink(about.body));

  const userLogin = await getText("/user/login");
  check("GET /user/login = 200", userLogin.res.status === 200);
  check("/user/login KHÔNG có link /admin", !hasAdminLink(userLogin.body));

  const adminLogin = await getText("/admin/login");
  check("GET /admin/login = 200 (URL trực tiếp vẫn vào)", adminLogin.res.status === 200);

  const adminGuard = await getText("/admin");
  const adminRedir = [301, 302, 303, 307, 308].includes(adminGuard.res.status);
  check(`GET /admin chưa login → redirect (status ${adminGuard.res.status})`,
    adminRedir && /\/admin\/login/i.test(adminGuard.res.headers.get("location") ?? ""));

  const userGuard = await getText("/user/secretary");
  const userRedir = [301, 302, 303, 307, 308].includes(userGuard.res.status);
  check(`GET /user/secretary chưa login → redirect (status ${userGuard.res.status})`,
    userRedir && /\/user\/login/i.test(userGuard.res.headers.get("location") ?? ""));
}

try {
  await main();
} catch (e) {
  failed++;
  console.error("[portal] LỖI:", String(e?.message ?? e));
}
console.log(`\n[portal] KẾT QUẢ: ${passed} pass · ${failed} fail`);
process.exit(failed > 0 ? 1 : 0);
