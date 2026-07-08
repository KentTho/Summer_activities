# Chuẩn tổ chức thư mục (Folder Architecture Standard)

> Tạo ở **Prompt 10A**. Đây là **chuẩn đề xuất** cho dự án Next.js App Router + Supabase + Vercel
> ở quy mô hiện tại (một team nhỏ, sản phẩm thật). Mục tiêu: dev mới đọc là biết **đặt file mới vào đâu**.
>
> Tài liệu này **mô tả chuẩn nên theo**, không bắt buộc refactor code hiện có ngay. Việc dịch chuyển
> dần theo [`project-structure-refactor-backlog.md`](./project-structure-refactor-backlog.md).

---

## 0. Nguyên tắc nền

1. **Ranh giới client/server là ranh giới bảo mật.** Bất kỳ thứ gì chạm `SUPABASE_SERVICE_ROLE_KEY`
   hoặc key AI → **chỉ server**, đặt trong module có `import "server-only"` hoặc file server action.
2. **Một nguồn sự thật cho mỗi trách nhiệm.** Không để cùng một logic tồn tại ở hai nơi (bài học:
   `src/modules/` rỗng trùng ý đồ với `src/lib/`).
3. **Presentation mỏng.** Component/page chỉ hiển thị + gọi action/data-access; không nhét truy vấn
   Supabase hay business rule vào JSX.
4. **Colocation trước, tách sau.** Đặt file cạnh nơi dùng; chỉ nâng lên dùng chung khi có ≥ 2 nơi dùng.
5. **Additive-first.** Thêm cấu trúc mới không phá import cũ; đổi vị trí lớn phải có test bao phủ.

---

## 1. `src/app/` — Presentation (App Router)

- **Mục đích:** route, layout, page, Server Actions entrypoint, form component gắn với route.
- **Nên chứa:** `page.tsx`, `layout.tsx`, `route.ts` (route handler), `actions.ts` (Server Actions của
  route đó), `*Form.tsx` / `*Button.tsx` (client component riêng của route), `loading.tsx`, `error.tsx`.
- **Không nên chứa:** truy vấn Supabase trực tiếp (gọi qua `src/lib/data/*`), business rule thuần,
  hằng số/enum dùng chung, kiểu dữ liệu global.
- **Route groups:** dùng để tách cổng/luồng không đổi URL: `admin/(auth)`, `admin/(portal)`,
  `user/(auth)`. Cổng theo vai trò: `admin/*` vs `user/secretary/*` vs `user/parent/*`.
- **Ví dụ file:** `app/user/secretary/sessions/actions.ts`, `app/user/secretary/sessions/[sessionId]/page.tsx`,
  `app/admin/(portal)/settings/SettingsForm.tsx`.
- **Đặt tên:** thư mục route = **kebab-case tiếng Anh** (`leave-requests`); `page.tsx`/`layout.tsx`/
  `actions.ts`/`route.ts` giữ đúng tên chuẩn Next; client component = **PascalCase** (`CreateSessionForm.tsx`).
- **Server Action:** mỗi action `"use server"`, validate lại bằng Zod, whitelist field, không tin input client.

## 2. `src/components/` — UI tái sử dụng (dùng ≥ 2 nơi)

- **Mục đích:** component không gắn với một route cụ thể.
- **Nên chứa:** `ui/` (nguyên tử: Button, Card, Badge, StatCard), `layout/` (AuthShell, DashboardShell,
  SidebarNav, PageHeader, `nav-config.ts`), `forms/` (form dùng chung như LoginForm). Mỗi nhóm có `index.ts` barrel.
- **Không nên chứa:** component chỉ dùng ở đúng 1 route (để cạnh route đó trong `app/`), logic truy cập DB.
- **Ví dụ file:** `components/ui/Button.tsx`, `components/layout/DashboardShell.tsx`.
- **Đặt tên:** file component **PascalCase**; file cấu hình/util **kebab-case** (`nav-config.ts`).
- **Khi nào nâng vào đây:** khi component thứ 2 cần dùng → move từ `app/` lên `components/`.

## 3. `src/lib/` — Hạ tầng + Data Access + Domain dùng chung

Đây là **trục chính** của dự án hiện tại. Quy ước rõ theo thư mục con:

| Thư mục con | Trách nhiệm | Nên chứa | Không nên chứa |
|---|---|---|---|
| `supabase/` | Tạo client | `client.ts` (browser), `server.ts` (RLS server), `admin.ts` (**service role, server-only**), `proxy.ts` | Query nghiệp vụ |
| `auth/` | Phiên & phân quyền | `session.ts`, `rbac.ts`, `require-admin.ts`, `identifier.ts`, `actions.ts` | UI |
| `data/` | **Data-access layer** (đọc/ghi qua RLS) | 1 file/domain: `students.ts`, `sessions.ts`, `reports.ts`… | Service role, JSX |
| `admin/`, `storage/` | Thao tác cần **service role** (sau `requireAdmin()`) | `accounts.ts`, `audit.ts`, `storage/*` | Gọi từ client |
| `ai-import/`, `docx/`, `reports/` | Adapter/engine chuyên biệt | Gemini, ZIP/OOXML writer, template-merge | Query rải rác |
| `security/`, `validation/` | Kiểm tra input & file | Zod schema, whitelist mime/size | Logic UI |
| `monitoring/`, `utils/`, `types/` | Tiện ích chung | logger redact PII, `cn`, kiểu chung | Secret |
| `env.ts`, `database.types.ts` | Cấu hình & type DB | Đọc env có validate; type sinh từ `supabase gen types` | Giá trị secret hardcode |

- **Quy ước data-access:** mọi truy vấn Supabase của nghiệp vụ đi qua `src/lib/data/*` (đọc/ghi RLS)
  hoặc `src/lib/admin` + `src/lib/storage` (khi bắt buộc service role, **luôn sau xác thực role**).
  Component/page **không** tự `createClient().from(...)`.
- **Không nên:** nhồi mọi thứ vào `lib/` không phân loại; đặt component React trong `lib/`.

## 4. `src/features/` **hoặc** `src/modules/` — Domain theo bounded context

> **Quyết định kiến trúc cần chốt** (xem audit mục 5, hàng CAO). Hiện `src/modules/` là skeleton rỗng;
> chọn **một** hướng và dọn hướng còn lại:

- **Hướng A (khuyến nghị cho quy mô hiện tại):** bỏ tầng `application/infrastructure` rỗng, giữ
  **domain thuần** (enum trạng thái, role, nhãn, business rule không phụ thuộc DB) ở một nơi gọn —
  ví dụ `src/lib/domain/*` hoặc `src/features/<ctx>/domain.ts`. Data-access vẫn ở `src/lib/data/*`.
- **Hướng B (khi hệ thống lớn hơn):** `src/features/<ctx>/` gói trọn 1 domain: `domain.ts`
  (rule thuần), `data.ts` (truy cập DB), `actions.ts` (server action), `components/`. Presentation trong
  `app/` chỉ import từ feature.
- **Không nên:** để tồn tại đồng thời skeleton rỗng **và** logic ở nơi khác (tình trạng hiện tại).
- **Khi nào tách module/feature mới:** khi một domain có ≥ 2 trong số {rule thuần riêng, nhiều bảng,
  nhiều màn hình, cần test cô lập}. Domain đơn giản (CRUD 1 bảng) không cần tách — để ở `lib/data`.
- **Ví dụ file (Hướng B):** `features/attendance/domain.ts`, `features/attendance/data.ts`.

## 5. `src/server/` — (tùy chọn) gom logic server-only

- **Mục đích:** nếu muốn tách rạch ròi thứ **tuyệt đối không bao giờ ra client**.
- **Nên chứa:** service-role clients, provisioning, storage binary, engine DOCX server.
- **Hiện tại:** vai trò này đang do `src/lib/{supabase/admin, admin, storage, docx}` đảm nhiệm với
  `import "server-only"`. **Chưa cần** tạo `src/server/` riêng ở quy mô này — ghi nhận để cân nhắc sau.

## 6. `src/types/` — (đề xuất) type dùng chung toàn app

- **Mục đích:** kiểu global không thuộc riêng domain nào.
- **Nên chứa:** type tiện ích chung, re-export `database.types.ts`.
- **Không nên chứa:** type chỉ dùng trong 1 module (để cạnh module).
- **Hiện tại:** rải ở `lib/types`, `lib/database.types.ts`, `lib/ai-import/types`. Chuẩn hóa dần, không gấp.

## 7. `src/config/` — (đề xuất) cấu hình tập trung

- **Mục đích:** hằng số cấu hình app (không phải secret): nav, feature flags tĩnh, giới hạn.
- **Hiện tại:** `env.ts` (đọc env có validate) ở `lib/`, `nav-config.ts` ở `components/layout/`. Chấp nhận
  được ở quy mô này; nếu config phình thì gom về `src/config/`.

## 8. `supabase/` — Nguồn sự thật của schema

- **Nên chứa:** `migrations/*.sql` (đặt tên `YYYYMMDDHHMMSS_mô-tả.sql`, **additive-first**),
  `tests/*.sql` (RLS smoke), `seed.sql` (chỉ dev), `config.toml`, `README.md`.
- **Không nên chứa:** secret, `.branches`/`.temp` (đã gitignore).
- **Quy tắc:** migration là nguồn sự thật; RLS **deny-by-default**, không `using(true)` ở bảng dữ liệu
  cá nhân; hàm quyền `SECURITY DEFINER` để tránh đệ quy RLS; **không** `db reset`/drop trên production.

## 9. `docs/` — Tài liệu & report

- **Nên chứa:** `PROJECT_PROGRESS.md` (checklist), `IMPLEMENTATION_HISTORY.md` (nhật ký), `reports/`
  (1 report/prompt), tài liệu chủ đề (architecture, security, playbook, data-model), `spec/`.
- **Quy tắc report:** mỗi prompt tạo `docs/reports/PROMPT-<mã>-<slug>-report.md`, có mục **Gợi ý bước
  tiếp theo** bắt buộc (xem memory `report-next-steps-convention`).
- **Không nên chứa:** secret, ảnh chụp có PII.

## 10. `scripts/` — Script vận hành

- **Nên chứa:** `preflight-check.mjs`, `bootstrap-auth-users.mjs`… (Node thuần, chạy tay/CI).
- **Không nên chứa:** secret hardcode; script phá dữ liệu production.

## 11. `.github/` — CI/CD

- **Nên chứa:** `workflows/ci.yml` (lint · typecheck · build; **nên thêm** job test).
- **Quy tắc:** CI phải xanh trước khi merge; không "tắt kiểm tra cho qua CI"; secret production ở
  GitHub Environments/Vercel, không trong repo.

---

## 12. Checklist khi thêm feature mới

1. **UI/route** → tạo trong `src/app/<cổng>/<feature>/` (`page.tsx` + `actions.ts` + `*Form.tsx`).
2. **Đọc/ghi DB** → thêm hàm vào `src/lib/data/<domain>.ts` (qua **RLS**), KHÔNG query trong page.
3. **Cần service role?** → chỉ trong `src/lib/{admin,storage}` và **sau `requireAdmin()`**; không ra client.
4. **Rule thuần / enum trạng thái** → đặt ở domain (hiện: `src/modules/*/domain` hoặc nơi đã chốt ở mục 4).
5. **Validate input** → Zod ở server (`src/lib/validation` / `security`), whitelist field & file.
6. **Component dùng lại** → nâng lên `src/components/*` khi có nơi thứ 2 dùng.
7. **Đổi schema** → migration additive trong `supabase/migrations/`, chạy `gen types`, cập nhật RLS.
8. **Bảo mật** → không log PII/secret; thông báo lỗi trung lập; giữ staging cho AI import.
9. **Kiểm thử** → thêm/really-run RLS smoke bằng **client đăng nhập thật** (không chỉ service role).
10. **Tài liệu** → cập nhật `PROJECT_PROGRESS.md` + `IMPLEMENTATION_HISTORY.md` + tạo report + health phase.
</content>
