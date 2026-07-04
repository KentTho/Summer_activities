import { Button } from "@/components/ui";

/**
 * Login shell (Phase 1) — chưa gọi Supabase Auth. Form bị disabled để nhấn
 * mạnh rằng đây là khung. Xác thực thật + rate limit đăng nhập: Phase sau (spec §7).
 */
export default function LoginPage() {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h1 className="text-lg font-semibold text-slate-900">Đăng nhập</h1>
      <p className="mt-1 text-sm text-slate-500">
        Cổng xác thực hệ thống điểm danh sinh hoạt hè.
      </p>

      <form className="mt-6 space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            Tài khoản
          </label>
          <input
            type="text"
            disabled
            placeholder="Email / số điện thoại"
            className="h-11 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none disabled:bg-slate-50"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            Mật khẩu
          </label>
          <input
            type="password"
            disabled
            placeholder="••••••••"
            className="h-11 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none disabled:bg-slate-50"
          />
        </div>
        <Button type="button" disabled className="w-full">
          Đăng nhập (chưa kích hoạt)
        </Button>
      </form>

      <p className="mt-4 text-xs text-slate-400">
        Phase 1: scaffold. Supabase Auth sẽ được nối ở phase sau.
      </p>
    </div>
  );
}
