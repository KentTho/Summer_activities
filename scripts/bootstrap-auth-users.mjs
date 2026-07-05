/**
 * Bootstrap DEMO auth users + profiles (Prompt 05).
 *
 * ⚠️ SERVER/LOCAL ONLY. Cần SUPABASE_SERVICE_ROLE_KEY (bỏ qua RLS).
 * KHÔNG chạy tự động. Chỉ chạy khi bạn CHỦ ĐÍCH muốn tạo tài khoản demo.
 * Không hardcode mật khẩu: đọc từ DEMO_USER_PASSWORD, nếu thiếu sẽ sinh ngẫu nhiên và in ra.
 *
 * Cách chạy (đọc env từ .env.local — KHÔNG commit .env.local):
 *   node --env-file=.env.local scripts/bootstrap-auth-users.mjs
 *
 * Lưu ý an toàn:
 * - Chỉ tạo user với email demo (@sinhhoathe.local) và upsert profiles cho đúng các user đó.
 * - Idempotent: nếu user đã tồn tại thì bỏ qua tạo, chỉ đồng bộ profile.
 * - Không đụng tới bảng nghiệp vụ khác, không seed dữ liệu học sinh/điểm danh.
 * - Không chạy script này lên project production nếu chưa được phép.
 */
import { randomBytes } from "node:crypto";
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error(
    "[bootstrap] Thiếu NEXT_PUBLIC_SUPABASE_URL hoặc SUPABASE_SERVICE_ROLE_KEY — bỏ qua (skip).",
  );
  process.exit(0);
}

const password =
  process.env.DEMO_USER_PASSWORD ?? `Demo-${randomBytes(9).toString("base64url")}`;
if (!process.env.DEMO_USER_PASSWORD) {
  console.log(`[bootstrap] DEMO_USER_PASSWORD chưa đặt → dùng mật khẩu sinh ngẫu nhiên:`);
  console.log(`[bootstrap]   ${password}`);
}

/** Tài khoản demo — dữ liệu GIẢ. */
const DEMO_USERS = [
  { email: "admin.demo@sinhhoathe.local", role: "ADMIN", fullName: "Quản trị Demo" },
  { email: "bithu.demo@sinhhoathe.local", role: "SECRETARY", fullName: "Bí thư Demo" },
  { email: "phuhuynh.demo@sinhhoathe.local", role: "PARENT", fullName: "Phụ huynh Demo" },
];

const admin = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

/** Tìm auth user theo email (phân trang phòng khi nhiều user). */
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

async function ensureUser({ email, role, fullName }) {
  let user = await findUserByEmail(email);

  if (user) {
    console.log(`[bootstrap] ~ user đã tồn tại: ${email}`);
  } else {
    const { data, error } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName, seed: "demo" },
    });
    if (error) throw error;
    user = data.user;
    console.log(`[bootstrap] + tạo user: ${email}`);
  }

  // Upsert profile (service role bỏ qua RLS). Khóa theo auth_user_id (unique).
  const { error: pErr } = await admin
    .from("profiles")
    .upsert(
      { auth_user_id: user.id, role, full_name: fullName, email, active: true },
      { onConflict: "auth_user_id" },
    );
  if (pErr) throw pErr;
  console.log(`[bootstrap]   profile ok: role=${role}`);
}

try {
  console.log(`[bootstrap] Target: ${url}`);
  for (const u of DEMO_USERS) {
    await ensureUser(u);
  }
  console.log("[bootstrap] Xong. Đăng nhập bằng email demo + mật khẩu ở trên.");
} catch (err) {
  console.error("[bootstrap] LỖI:", err.message ?? err);
  process.exit(1);
}
