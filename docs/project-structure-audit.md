# Rà soát cấu trúc dự án (Project Structure Audit)

> Tạo ở **Prompt 10A**. Tài liệu **chỉ đánh giá**, KHÔNG sửa code. Mục đích: trả lời câu hỏi
> "dự án đã tổ chức hợp lý chưa, có triển khai thực tế ra thị trường được không?" và chỉ ra
> điểm mạnh / rủi ro / cần cải thiện.
>
> Xem thêm: [`folder-architecture-standard.md`](./folder-architecture-standard.md) (chuẩn đề xuất)
> và [`project-structure-refactor-backlog.md`](./project-structure-refactor-backlog.md) (việc cải thiện sau).

---

## 1. Tổng quan cấu trúc hiện tại

Stack: **Next.js 16 (App Router) · TypeScript · Tailwind v4 · Supabase (Postgres/Auth/Storage) · Zod · Vercel.**
Path alias: `@/* → src/*`.

```
diem-danh-sinh-hoat-he-app/
├─ src/
│  ├─ app/                         # Presentation (App Router) — routes + Server Actions + forms
│  │  ├─ (public)/gioi-thieu/      #   route công khai
│  │  ├─ admin/(auth)/             #   cổng đăng nhập Admin
│  │  ├─ admin/(portal)/           #   khu vực Admin (dashboard, neighborhoods, secretaries,
│  │  │                            #   parents, assignments, students, sessions, templates,
│  │  │                            #   reports, audit, settings) — mỗi trang có actions.ts + *Form.tsx
│  │  ├─ user/(auth)/              #   cổng đăng nhập Người dùng
│  │  ├─ user/secretary/           #   cổng Bí thư/Chi Đoàn (students, sessions, attendance,
│  │  │                            #   leave-requests, import, reports, notifications)
│  │  ├─ user/parent/              #   cổng Phụ huynh (schedule, attendance, leave-requests, notifications)
│  │  ├─ change-password/          #   ép đổi mật khẩu lần đầu (ngoài layout cổng để tránh loop)
│  │  ├─ api/health/route.ts       #   health check + feature flags
│  │  ├─ layout.tsx · page.tsx · globals.css
│  ├─ components/                  # UI tái sử dụng
│  │  ├─ ui/       (Badge, Button, Card, StatCard, DemoNotice, index.ts)
│  │  ├─ layout/   (AuthShell, DashboardShell, PageHeader, SidebarNav, nav-config.ts, index.ts)
│  │  └─ forms/    (LoginForm)
│  ├─ lib/                         # ★ Hạ tầng + data-access + business logic THẬT nằm ở đây
│  │  ├─ supabase/ (client, server, admin[service-role], proxy)
│  │  ├─ auth/     (actions, session, rbac, require-admin, identifier)
│  │  ├─ data/     (admin, students, sessions, parent, leave, notifications, reports,
│  │  │             imports, templates, secretary-dashboard, ai-import-usage)  ← data-access layer
│  │  ├─ admin/    (accounts[provisioning service-role], audit)
│  │  ├─ ai-import/(gemini, normalize, types, index)
│  │  ├─ docx/     (zip, unzip, document, merge)  ← bộ ghi DOCX zero-dependency
│  │  ├─ reports/  (blocks, response, template-merge)
│  │  ├─ storage/  (templates, ai-import)  ← bucket private qua service role
│  │  ├─ monitoring/(server-log)  ├─ security/  ├─ validation/  ├─ types/  ├─ utils/
│  │  ├─ env.ts    └─ database.types.ts (sinh từ supabase gen types)
│  ├─ modules/                     # ⚠ Bounded-context skeleton — PHẦN LỚN LÀ PLACEHOLDER rỗng
│  │  └─ <ctx>/{domain,application,infrastructure}/index.ts
│  │     (application/ + infrastructure/ = `export {}`; chỉ vài domain enum thật được import)
│  └─ proxy.ts                     # Route guard (Next 16 đổi tên từ middleware.ts)
├─ supabase/  (config.toml, migrations/*.sql [13], tests/rls_smoke.sql, seed.sql, README.md)
├─ docs/      (~40 file: progress, history, reports/, architecture, security, playbook…)
├─ scripts/   (preflight-check.mjs, bootstrap-auth-users.mjs)
├─ .github/workflows/ci.yml   (lint · typecheck · build)
└─ config: next.config.ts · vercel.json · tsconfig.json · eslint.config.mjs · .env.example
```

**Điểm mấu chốt cần hiểu ngay:** business logic + truy cập DB THẬT nằm ở **`src/lib/`**
(đặc biệt `src/lib/data/*` và các server action trong `src/app/**/actions.ts`), **không** nằm ở
`src/modules/`. `src/modules/*` chỉ còn là khung `domain/application/infrastructure`, trong đó
`application/` và `infrastructure/` gần như rỗng; chỉ một số file `domain/*` (enum trạng thái,
role, staff-title…) là code thật và được import. Đây là **điểm lệch giữa tài liệu và thực tế**
(xem mục 5, hàng CAO).

---

## 2. Đánh giá market-ready (có triển khai thực tế được không?)

**Kết luận ngắn: CÓ — đủ nền để triển khai thực tế ở quy mô pilot/nhỏ**, với điều kiện xử lý
vài điểm tài liệu lệch và **ra quyết định về `src/modules/`** trước khi mở rộng team. **Không cần
refactor lớn ngay.**

| Tiêu chí (10 mục) | Trạng thái | Ghi chú |
|---|---|---|
| 1. Dễ hiểu cho dev mới | 🟡 Khá | App/components/lib rõ; nhưng `modules/` rỗng + docs lệch gây nhầm |
| 2. Tách trách nhiệm rõ | 🟢 Tốt | data-access (`lib/data`) tách khỏi presentation; Server Actions cho ghi |
| 3. Không trộn client/server | 🟢 Tốt | service role chỉ ở `lib/supabase/admin` + `lib/admin`/`lib/storage` server-side |
| 4. Không lộ secret | 🟢 Tốt | `.env.example` sạch (placeholder), preflight quét secret, key AI server-only |
| 5. RLS/Auth rõ ràng | 🟢 Tốt (production-grade) | RLS deny-by-default, guard 2 lớp, RBAC theo role + Khu phố |
| 6. Docs đủ để bảo trì | 🟢 Tốt | Playbook vận hành + report từng prompt rất đầy đủ (nhưng vài file stale) |
| 7. Mở rộng tính năng | 🟡 Khá | Thêm feature theo pattern hiện tại dễ; nhưng chưa nhất quán module vs lib |
| 8. Khả năng test | 🟡 MVP | Có RLS smoke test SQL nhưng chạy **thủ công**; CI chưa có job test tự động |
| 9. Deploy/rollback | 🟢 Tốt | Vercel instant rollback + migration additive + health + CI xanh |
| 10. Ít rủi ro khi scale team | 🟡 Khá | Cần chốt kiến trúc module + cập nhật docs trước khi nhiều người cùng sửa |

**Đạt production-grade:** bảo mật (RLS/Auth/RBAC), vệ sinh secret, data-access tách lớp,
deploy/rollback, tài liệu vận hành.

**Còn ở mức MVP:** kiểm thử tự động (chưa vào CI); `src/modules/` chưa dùng đúng vai trò;
monitoring tập trung/alert; UI polish.

---

## 3. Điểm mạnh

1. **Tách cổng rõ ràng bằng route groups**: `admin/(auth|portal)`, `user/(auth)` + `user/{secretary,parent}`.
   Ranh giới vai trò thể hiện ngay trên cây thư mục.
2. **Data-access layer thật** (`src/lib/data/*`): truy vấn Supabase gom một chỗ theo domain, tránh
   N+1, không rải query trong component.
3. **Server Actions co-located** đúng chuẩn App Router: `actions.ts` + `*Form.tsx` (client) cạnh `page.tsx`.
4. **Bảo mật đặt lên hàng đầu**: service role **chỉ** server-side, RLS deny-by-default là chặn cuối,
   Zod validate server, audit append-only, storage private, rate-limit AI atomic ở DB.
5. **Vệ sinh secret tốt**: `.env.example` chỉ placeholder; `scripts/preflight-check.mjs` quét rò rỉ secret
   + import mock + health phase cũ trước khi commit.
6. **Zero-dependency có chủ đích** cho DOCX/ZIP (giảm bề mặt phụ thuộc, dễ audit).
7. **Tài liệu vận hành rất đầy đủ** so với quy mô: playbook deploy/rollback/backup, auth hardening,
   AI security gate, test plan, storage policy + report từng prompt (truy vết lịch sử tốt).
8. **CI/CD + migration kỷ luật**: CI lint/typecheck/build, migration additive/idempotent, health có feature flags.

---

## 4. Điểm yếu / rủi ro (tóm tắt — chi tiết ở mục 5)

1. **`src/modules/` là skeleton rỗng** trùng ý đồ với `src/lib/`; `architecture.md` vẫn mô tả logic
   nằm ở `modules/` → dev mới dễ tìm nhầm chỗ.
2. **`README.md` + `architecture.md` lỗi thời**: README ghi "Phase 1 — Scaffold, chưa có nghiệp vụ thật"
   trong khi dự án đã tới 09C (Auth/CRUD/Attendance/DOCX/AI thật). Sơ đồ route trong architecture.md
   không khớp cây thật (`secretary/`, `parent/` ở gốc app — thực tế là `user/secretary`, `user/parent`).
3. **Kiểm thử chưa tự động trong CI**: RLS smoke test là SQL chạy tay mỗi prompt.
4. **Chưa có `src/types` / `src/config` tập trung**: types rải ở `lib/types`, `lib/database.types.ts`,
   `lib/ai-import/types`, `modules/*/domain`; config env ở `lib/env.ts`, nav ở `components/layout/nav-config.ts`.
5. **Component `DemoNotice` còn export nhưng không dùng** (đã nằm trong backlog cũ).

---

## 5. Bảng rủi ro / cần cải thiện

| Mức độ | Vấn đề | Vị trí | Tác động | Đề xuất xử lý (KHÔNG làm trong 10A) |
|---|---|---|---|---|
| **Cao** | `src/modules/*` phần lớn là placeholder `export {}`; logic thật ở `src/lib/`. Kiến trúc "bounded context" mô tả trong docs không phản ánh code | `src/modules/**`, `docs/architecture.md` | Dev mới tìm nhầm nơi đặt code; nợ kiến trúc tăng khi mỗi người đặt một kiểu | Ra **1 quyết định**: (A) gộp domain enum về `src/lib` / `src/features` và xóa skeleton rỗng, hoặc (B) thật sự chuyển data-access vào `modules/*/infrastructure`. Ưu tiên (A) cho quy mô hiện tại. Làm ở prompt refactor riêng |
| **Cao** | `README.md` mô tả sai trạng thái ("Phase 1 — Scaffold") | `README.md` | Người ngoài/nhà đầu tư/dev mới hiểu sai độ chín của sản phẩm | Cập nhật README theo trạng thái thật (tới 09C) ở prompt tài liệu kế tiếp |
| Trung bình | Sơ đồ thư mục/route trong `architecture.md` lệch cây thật (thiếu `user/*`, route groups, `change-password`, dynamic `[sessionId]`) | `docs/architecture.md` | Sai bản đồ → mất thời gian dò | Vẽ lại sơ đồ theo cây thật; trỏ sang `folder-architecture-standard.md` |
| Trung bình | Trách nhiệm data-access rải nhiều thư mục `lib/` (`data`, `admin`, `storage`, `reports`) không có quy ước gọi tên rõ | `src/lib/*` | Khó biết đặt file mới vào đâu khi thêm feature | Ghi **quy ước** trong `folder-architecture-standard.md` (đã làm ở 10A) |
| Trung bình | CI chưa chạy test tự động; RLS smoke test SQL thủ công | `.github/workflows/ci.yml`, `supabase/tests/` | Regression RLS/nghiệp vụ có thể lọt | Thêm job test (pgTAP/script ký tên) vào CI — backlog |
| Trung bình | Chưa có `src/types` (global) và `src/config` tập trung | `src/lib/*`, `components/layout/nav-config.ts` | Types/config khó tìm khi nhiều người sửa | Chuẩn hóa dần theo `folder-architecture-standard.md`; không bắt buộc ngay |
| Thấp | `DemoNotice` export nhưng không render | `src/components/ui/DemoNotice.tsx` | Dead code nhẹ | Xóa khi tiện (đã trong backlog) |
| Thấp | Casing hỗn hợp trong `app/` (`actions.ts` vs `PascalCase.tsx`) — thực tế nhất quán theo vai trò file nhưng chưa ghi quy ước | `src/app/**` | Người mới không rõ luật đặt tên | Ghi quy ước đặt tên (đã làm ở 10A) |
| Thấp | `major_version` Postgres local 15 vs remote 17 | `supabase/config.toml` | Chỉ ảnh hưởng dev local | Đồng bộ khi tiện (backlog cũ) |

> Không sửa các vấn đề trên trong Prompt 10A — chỉ ghi nhận. Chi tiết lộ trình ở
> [`project-structure-refactor-backlog.md`](./project-structure-refactor-backlog.md).

---

## 6. Kết luận — có triển khai thực tế được không?

**Được, cho triển khai thực tế quy mô pilot/nhỏ.** Nền tảng bảo mật, phân lớp data-access,
CI/CD và tài liệu vận hành đã ở mức có thể vận hành thật. Rủi ro lớn nhất **không phải kỹ thuật
runtime** mà là **nợ kiến trúc + tài liệu lệch** (`src/modules/` rỗng, README/architecture cũ) —
gây nhầm lẫn khi **mở rộng team**, không chặn việc chạy production.

**Khuyến nghị:**
- **Không** refactor lớn ngay. Ưu tiên **cập nhật tài liệu** (README, architecture) để phản ánh
  thực tế, rồi **chốt quyết định về `src/modules/`** ở một prompt refactor riêng, có test bao phủ.
- Giữ nguyên các bất biến an toàn (RLS, service role server-only, staging AI, private storage).
- Bổ sung test tự động vào CI **trước khi** nhiều người cùng sửa code.
</content>
</invoke>
