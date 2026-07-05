/**
 * Bootstrap tài khoản THẬT + phân công (Prompt 06A).
 *
 * ⚠️ SERVER/LOCAL ONLY. Cần SUPABASE_SERVICE_ROLE_KEY (bỏ qua RLS).
 * KHÔNG chạy tự động. Không log password/token. Không hardcode service role.
 *
 * Cách chạy (đọc env từ .env.local — KHÔNG commit .env.local):
 *   node --env-file=.env.local scripts/bootstrap-auth-users.mjs
 *
 * Tạo theo yêu cầu user:
 *   - Admin:   tài khoản "Admin"        / mật khẩu "admin@123"   (role ADMIN)
 *   - Bí thư:  tài khoản "0932077136"   / mật khẩu "tho@123"     (role SECRETARY)
 * và 1 Khu phố "KP01" + gán Bí thư phụ trách để CRUD học sinh hoạt động.
 *
 * Idempotent. Mật khẩu ở đây do user yêu cầu để khởi tạo — nên bắt đổi mật khẩu sau
 * (đặt cờ user_metadata.must_change_password = true).
 */
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error(
    "[bootstrap] Thiếu NEXT_PUBLIC_SUPABASE_URL hoặc SUPABASE_SERVICE_ROLE_KEY — dừng (skip). " +
      "Thêm SUPABASE_SERVICE_ROLE_KEY (server-only) vào .env.local rồi chạy lại.",
  );
  process.exit(0);
}

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

const ACCOUNTS = [
  {
    identifier: "Admin",
    password: "admin@123",
    role: "ADMIN",
    fullName: "Quản trị viên",
    phone: null,
  },
  {
    identifier: "0932077136",
    password: "tho@123",
    role: "SECRETARY",
    fullName: "Bí thư Thọ",
    phone: "0932077136",
  },
];

const NEIGHBORHOOD = { code: "KP01", name: "Khu phố 1" };

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

async function ensureAccount({ identifier, password, role, fullName, phone }) {
  const email = identifierToEmail(identifier);
  let user = await findUserByEmail(email);

  if (user) {
    console.log(`[bootstrap] ~ user đã tồn tại: ${identifier}`);
  } else {
    const { data, error } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: fullName,
        login_identifier: identifier,
        must_change_password: true,
      },
    });
    if (error) throw error;
    user = data.user;
    console.log(`[bootstrap] + tạo user: ${identifier}`);
  }

  const { data: profile, error: pErr } = await admin
    .from("profiles")
    .upsert(
      { auth_user_id: user.id, role, full_name: fullName, email, phone, active: true },
      { onConflict: "auth_user_id" },
    )
    .select("id")
    .single();
  if (pErr) throw pErr;
  console.log(`[bootstrap]   profile ok: role=${role}`);
  return profile.id;
}

async function ensureNeighborhood({ code, name }) {
  const { data, error } = await admin
    .from("neighborhoods")
    .upsert({ code, name, active: true }, { onConflict: "code" })
    .select("id")
    .single();
  if (error) throw error;
  console.log(`[bootstrap]   neighborhood ok: ${code}`);
  return data.id;
}

async function assignSecretary(secretaryProfileId, neighborhoodId) {
  const { error } = await admin
    .from("secretary_neighborhoods")
    .upsert(
      { secretary_id: secretaryProfileId, neighborhood_id: neighborhoodId },
      { onConflict: "secretary_id,neighborhood_id" },
    );
  if (error) throw error;
  console.log(`[bootstrap]   assignment ok: secretary ↔ ${NEIGHBORHOOD.code}`);
}

try {
  console.log(`[bootstrap] Target: ${url}`);
  const profileIds = {};
  for (const acc of ACCOUNTS) {
    profileIds[acc.role] = await ensureAccount(acc);
  }
  const neighborhoodId = await ensureNeighborhood(NEIGHBORHOOD);
  if (profileIds.SECRETARY) {
    await assignSecretary(profileIds.SECRETARY, neighborhoodId);
  }
  console.log("[bootstrap] Xong. Đăng nhập: Admin (cổng Quản trị) / 0932077136 (cổng Người dùng).");
  console.log("[bootstrap] LƯU Ý: nên bắt đổi mật khẩu sau lần đăng nhập đầu.");
} catch (err) {
  console.error("[bootstrap] LỖI:", err.message ?? err);
  process.exit(1);
}
