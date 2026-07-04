# Báo cáo PROMPT 03A — Review scaffold · Local run · GitHub push · Supabase connect

- **Ngày:** 2026-07-04
- **Project:** Web-App Điểm danh sinh hoạt hè
- **Thư mục:** `D:\web-app\sinhhoathe\diem-danh-sinh-hoat-he-app`
- **GitHub:** https://github.com/KentTho/Summer_activities.git
- **Supabase project:** `Summer_activities`

---

## A — Rà soát project

Cấu trúc hiện có (đã xác nhận):

- `src/app/` — App Router: `page.tsx`, `layout.tsx`, nhóm route `(auth)/login`,
  `(public)/gioi-thieu`, khu vực `admin/`, `parent/`, `secretary/`, và
  `api/health/route.ts`.
- `src/components/` — `ui/` (Button, Card), `layout/` (DashboardShell, PageHeader,
  nav-config), `forms/` (placeholder).
- `src/lib/` — `env.ts`, `supabase/` (client, server, proxy), `auth/` (rbac, session),
  `security/`, `types/`, `utils/`, `validation/`.
- `src/modules/` — 10 module theo kiến trúc domain/application/infrastructure
  (attendance, audit, auth, exports, imports, leave-requests, neighborhoods,
  notifications, sessions, students). **Chỉ là scaffold placeholder.**
- `supabase/` — `config.toml`, `seed.sql` (placeholder), `migrations/.gitkeep`
  (**chưa có migration/schema thật**), `README.md`.
- `.github/workflows/ci.yml` — CI Lint · Typecheck · Build.
- `docs/` — tài liệu (overview, architecture, data-model, roadmap, security, spec).
- `.env.example` — mẫu biến môi trường, **tất cả giá trị để trống**.

Trạng thái Git ban đầu: nhánh `master`, chỉ có 1 commit
`Initial commit from Create Next App`, **chưa cấu hình remote**.

**Kết luận:** scaffold hợp lệ, migration hiện tại chỉ là placeholder → không tạo
schema/RLS thật ở bước này (đúng yêu cầu).

---

## B — Kiểm tra local

| Bước | Lệnh | Kết quả |
|------|------|---------|
| Môi trường | `node -v` / `npm -v` | Node v22.18.0 · npm 11.6.0 |
| Typecheck | `npm run typecheck` (`tsc --noEmit`) | ✅ Pass, không lỗi |
| Lint | `npm run lint` (`eslint`) | ✅ Pass, không cảnh báo |
| Build | `npm run build` (`next build`, Turbopack) | ✅ Compiled successfully — 8 route + Proxy middleware |

Route build: `/`, `/admin`, `/api/health` (ƒ), `/gioi-thieu`, `/login`, `/parent`,
`/secretary`, `/_not-found`.

---

## C — Chạy web local

- `npm run dev` khởi động thành công: **Ready in ~0.87s**
  - Local: http://localhost:3000
  - Network: http://192.168.100.7:3000
- Kiểm thử endpoint:
  - `GET /api/health` → `{"status":"ok","phase":"1-scaffold","supabaseConfigured":false,...}`
  - `GET /` → HTTP 200
  - `GET /login` → HTTP 200
- `supabaseConfigured:false` là đúng vì **chưa tạo `.env.local`** (secret do bạn điền).
- Đã dừng dev server sau khi kiểm thử.

> Để tự mở web: chạy `npm run dev` rồi mở http://localhost:3000

---

## D — Git sạch, commit & push

- Kiểm tra `.gitignore`: `node_modules/`, `.next/`, `.env*` (trừ `.env.example`),
  `*.tsbuildinfo` đều được ignore đúng (`git check-ignore` xác nhận).
- Quét nội dung staged: **không có secret thật** — `.env.example` để trống,
  `SUPABASE_SERVICE_ROLE_KEY=` rỗng; các match còn lại chỉ là tên biến/tài liệu.
- Xác nhận `SUPABASE_SERVICE_ROLE_KEY` **không** xuất hiện trong client code
  (`src/lib/supabase/client.ts` chỉ dùng anon key).
- **Sửa lỗi scaffold:** `.github/workflows/ci.yml` trước đó dùng
  `working-directory: diem-danh-sinh-hoat-he-app` (giả định repo lồng thư mục con).
  Repo này lấy chính thư mục app làm gốc → đã bỏ `working-directory` và sửa
  `cache-dependency-path` về `package-lock.json` để CI chạy đúng sau khi push.

---

## E — Kết nối Supabase (mức env/config an toàn)

- Không tạo schema/RLS/migration thật (đúng yêu cầu — migration hiện là placeholder).
- Kết nối chỉ ở mức cấu hình env qua `.env.example` → bạn sao chép thành `.env.local`.
- `supabase/config.toml`: `enable_signup = false` (tài khoản do Admin tạo),
  storage bucket không public.

### Việc BẠN cần điền (secret — tôi không tự đoán)

Từ Supabase Dashboard → project **Summer_activities** → *Settings → API*, tạo file
`.env.local` (KHÔNG commit) với:

```dotenv
NEXT_PUBLIC_SUPABASE_URL=<Project URL>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon public key>
SUPABASE_SERVICE_ROLE_KEY=<service_role key — CHỈ server-side>
APP_BASE_URL=http://localhost:3000
```

Sau khi điền, chạy lại `npm run dev` → `/api/health` sẽ báo `supabaseConfigured:true`.

---

## Giới hạn phạm vi (đúng yêu cầu prompt)

Chưa thực hiện ở prompt này: schema/RLS thật, OCR, DOCX export, CRUD, Auth thật.
Không xóa file/thư mục hiện có. Không commit secret.
