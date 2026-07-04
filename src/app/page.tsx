import Link from "next/link";

/**
 * Landing tạm cho Phase 1. Sau khi bật auth thật, trang này sẽ điều hướng
 * người dùng theo vai trò (ROLE_HOME). Hiện liệt kê lối vào để kiểm thử shell.
 */
export default function Home() {
  const entries = [
    { href: "/login", label: "Đăng nhập", hint: "Cổng xác thực (shell)" },
    { href: "/admin", label: "Admin", hint: "Quản trị hệ thống" },
    { href: "/secretary", label: "Bí thư", hint: "Quản lý & điểm danh" },
    { href: "/parent", label: "Phụ huynh / Học sinh", hint: "Lịch & xin nghỉ" },
  ];

  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col justify-center gap-8 px-6 py-12">
      <div>
        <p className="text-xs uppercase tracking-wide text-slate-400">
          Phase 1 · Scaffold
        </p>
        <h1 className="mt-1 text-2xl font-semibold text-slate-900">
          Điểm danh sinh hoạt hè
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          Nền tảng Next.js + Supabase theo Clean Architecture. Các lối vào dưới
          đây là layout shell cho ba vai trò, chưa gắn nghiệp vụ thật.
        </p>
      </div>

      <div className="grid gap-3">
        {entries.map((e) => (
          <Link
            key={e.href}
            href={e.href}
            className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm shadow-sm transition-colors hover:border-slate-300 hover:bg-slate-50"
          >
            <span className="font-medium text-slate-800">{e.label}</span>
            <span className="text-slate-400">{e.hint}</span>
          </Link>
        ))}
      </div>
    </main>
  );
}
