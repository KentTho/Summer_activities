# Auth redirect flow (10E)

Tài liệu mô tả luồng điều hướng đăng nhập/đăng xuất và guard theo vai trò sau
tối ưu 10E. Mục tiêu: **đã có phiên hợp lệ thì vào thẳng đúng portal, không bắt
người dùng "quay lại trang chủ".**

## Nguồn quyết định
- `getCurrentProfile()` (`src/lib/auth/session.ts`) — đọc auth user thật
  (`auth.getUser()`) → map `profiles` → `{ role, active, mustChangePassword }`.
- `homeForRole(role)` (`src/lib/auth/rbac.ts`) → `ROLE_HOME`:
  - `ADMIN` → `/admin`
  - `SECRETARY` → `/user/secretary`
  - `PARENT` → `/user/parent`
- Guard toàn cục: `src/proxy.ts` (Next 16 middleware) — chặn route bảo vệ khi
  **chưa** đăng nhập, redirect về login đúng cổng.
- Guard theo vai trò: layout từng cổng (`admin/(portal)/layout`, `user/secretary/layout`,
  `user/parent/layout`) — sai vai trò → `homeForRole`; `mustChangePassword` → `/change-password`.

## Trang login khi ĐÃ có phiên
`src/app/user/(auth)/login/page.tsx` và `src/app/admin/(auth)/login/page.tsx`:

```
profile = getCurrentProfile()
if (profile)
  redirect(profile.mustChangePassword ? "/change-password" : homeForRole(profile.role))
else render <LoginForm />
```

| Vào trang | Phiên | Kết quả |
|---|---|---|
| `/user/login` | chưa đăng nhập | hiện form |
| `/user/login` | SECRETARY | → `/user/secretary` |
| `/user/login` | PARENT | → `/user/parent` |
| `/user/login` | ADMIN | → `/admin` (KHÔNG vào portal User) |
| `/admin/login` | chưa đăng nhập | hiện form |
| `/admin/login` | ADMIN | → `/admin` |
| `/admin/login` | SECRETARY | → `/user/secretary` (sai cổng → về đúng khu vực) |
| `/admin/login` | PARENT | → `/user/parent` |
| bất kỳ login | `mustChangePassword=true` | → `/change-password` (đổi 1 hop) |

## Chặn khi CHƯA đăng nhập (proxy.ts)
- Route bảo vệ + không có user → redirect login đúng cổng
  (`/admin/*` → `/admin/login`, `/user/*` → `/user/login`).
- `PUBLIC_PATHS` (`/admin/login`, `/user/login`) được loại trừ để không tự chặn trang login.

## Không có redirect loop với /change-password
- `/change-password` nằm **ngoài** layout cổng (không bị guard cổng redirect về chính nó).
- Trang tự guard: chưa đăng nhập → `/user/login`.
- Login page ép `mustChangePassword` đi thẳng `/change-password` → khi đổi xong, cờ bị
  xóa (`auth.updateUser`) → lần sau vào login sẽ đi `homeForRole`.

## Guard sai vai trò (defense in depth)
1. `proxy.ts` chặn "chưa đăng nhập".
2. Layout cổng chặn "sai vai trò" (đọc role từ `profiles`).
3. **RLS Postgres là chặn cuối cùng** — kể cả khi qua được UI, DB vẫn từ chối dữ liệu ngoài phạm vi.

## Đăng xuất
`signOut(portal)` (`src/lib/auth/actions.ts`) — xóa phiên Supabase, redirect về login đúng cổng.
