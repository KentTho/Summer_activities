# Báo cáo PROMPT 04A — Sửa lỗi Vercel 404 + Kiểm tra deploy

- **Ngày:** 2026-07-04
- **Project:** Web-App Điểm danh sinh hoạt hè
- **Vercel project:** `summer-activities` (scope `kents-projects-d0ea1a96`)
- **Production:** https://summer-activities-theta.vercel.app
- **Phạm vi:** chỉ sửa lỗi deploy 404. **Không** làm Auth/DB/RLS/CRUD/OCR/DOCX.

---

## 1. Triệu chứng

Deploy production trạng thái **Ready** nhưng **mọi route trả 404**:

```
GET /              → 404  (X-Vercel-Error: NOT_FOUND)
GET /admin/login   → 404
GET /api/health    → 404
```

Header không có `X-Matched-Path` → 404 ở **tầng Vercel**, không phải 404 của Next.js.

## 2. Chẩn đoán

| Kiểm tra | Kết quả |
| --- | --- |
| `git log` / tree | Sạch, đúng `e187807`; có `src/app/layout.tsx` + `page.tsx`; 33 route |
| `next.config.ts` / `vercel.json` | Không có rewrite lạ; **không có** `vercel.json` |
| Build local | ✅ Pass (31 route) — code hoàn toàn khỏe mạnh |
| `vercel pull` → `.vercel/project.json` | **`"framework": null`**, `rootDirectory: null` |
| `vercel inspect` (deploy mới nhất) | **Builds: `. [0ms]`** — không có builder Next.js chạy |

**Nguyên nhân gốc:** Vercel project có **Framework Preset = null** (không nhận diện
Next.js). Vì vậy Vercel coi repo như project tĩnh/no-op: không chạy `@vercel/next`,
không sinh serverless function/route manifest → deploy "Ready" nhưng không có output
nào khớp request → `NOT_FOUND` toàn bộ. (`rootDirectory: null` = repo root là **đúng**,
không phải nguyên nhân.)

## 3. Cách sửa

Khai báo framework **rõ ràng, có version control** bằng `vercel.json` tối giản
(đây là cách chính thức của Vercel, **không** phải rewrite/hack che 404):

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "framework": "nextjs"
}
```

`vercel.json` ghi đè cấu hình Dashboard đang bị null → Vercel dùng builder Next.js.
Ưu điểm so với chỉnh tay Dashboard: nằm trong git, tái lập được cho mọi deploy sau.

## 4. Kết quả kiểm tra

**Build local:** ✅ Pass (không đổi — `vercel.json` không ảnh hưởng build local).

**Sau khi commit `6811fe8` + `vercel --prod`:**

```
GET /                          → 200   (X-Matched-Path: /)   ✅
GET /admin/login               → 200   ✅
GET /admin, /admin/audit       → 200   ✅
GET /user/login                → 200   ✅
GET /user/secretary            → 200   ✅
GET /user/parent               → 200   ✅
GET /user/secretary/attendance → 200   ✅
GET /gioi-thieu                → 200   ✅
GET /api/health                → 200   {"status":"ok",...}   ✅
GET /login                     → 307 → /user/login (redirect còn hoạt động) ✅
```

Không còn `X-Vercel-Error`. Header `X-Matched-Path` xuất hiện → routing Next.js đã
hoạt động. Deploy mới: `dpl_HmzNUremvQSHE7W6qhNjYATCjszM`, đã alias về
`summer-activities-theta.vercel.app`.

> Ghi chú: `/api/health` trả `supabaseConfigured:false` là **đúng** — chưa cấu hình
> biến môi trường Supabase trên Vercel (ngoài phạm vi prompt này).

## 5. An toàn & tuân thủ

- ✅ Không xóa route/docs/report cũ; không thêm rewrite hack.
- ✅ `vercel pull` tạo `.env.local` + `.vercel/` (chứa token/OIDC) — **đã gitignore**,
  không commit. Đã hoàn nguyên thay đổi thừa mà Vercel CLI thêm vào `.gitignore`
  (giữ `.env.example` được track, tránh trùng lặp).
- ✅ Không commit `.env.local`/`.next`/`node_modules`/secret; không dùng service role ở client.
- ✅ Không tự tạo/lưu Vercel token; dùng phiên đã đăng nhập sẵn (`kenttho`).

## 6. Khuyến nghị (tùy chọn, để đồng bộ Dashboard)

`vercel.json` đã đủ để fix. Nếu muốn Dashboard cũng hiển thị đúng, vào:
**Vercel → project `summer-activities` → Settings → Build & Deployment →
Framework Preset → chọn `Next.js`** (Root Directory để trống = repo root).

Khi sang phase auth/DB: thêm biến môi trường trên Vercel
(**Settings → Environment Variables**): `NEXT_PUBLIC_SUPABASE_URL`,
`NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` (chỉ server).
