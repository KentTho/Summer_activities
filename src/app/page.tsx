import Link from "next/link";

/**
 * Landing / entry page. Trang công khai CHỈ hiển thị **cổng Người dùng**
 * (Bí thư · Chi Đoàn · Phụ huynh/Học sinh). Cổng Quản trị KHÔNG hiện ở trang chủ —
 * Admin tự truy cập `/admin` hoặc `/admin/login`.
 *
 * Lưu ý bảo mật: ẩn link Admin CHỈ là giảm bề mặt/nhiễu cho người dùng thường.
 * Bảo mật thật vẫn là Auth + RBAC (layout guard) + RLS Postgres — không dựa vào ẩn link.
 */
export default function Home() {
  const features = [
    "Điểm danh nhanh theo buổi sinh hoạt",
    "Quản lý học sinh & phân quyền theo Khu phố",
    "Xin phép nghỉ, thông báo và báo cáo",
  ];

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col justify-center gap-10 px-6 py-12">
      <div>
        <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-600 text-base font-bold text-white">
          SH
        </span>
        <p className="mt-4 text-xs font-medium uppercase tracking-wide text-indigo-600">
          Web-app mobile-first
        </p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight text-slate-900">
          Điểm danh sinh hoạt hè
        </h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          Thay thế điểm danh giấy: quản lý học sinh theo Khu phố, lập buổi sinh
          hoạt, điểm danh nhanh, xử lý xin phép nghỉ và xuất báo cáo — bảo mật,
          phân quyền và audit chặt.
        </p>
        <ul className="mt-4 space-y-1.5">
          {features.map((f) => (
            <li key={f} className="flex items-start gap-2 text-sm text-slate-600">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-500" />
              {f}
            </li>
          ))}
        </ul>
      </div>

      <div className="grid gap-3">
        <Link
          href="/user/login"
          className="flex flex-col rounded-2xl bg-indigo-600 px-5 py-4 text-white shadow-sm transition-colors hover:bg-indigo-700"
        >
          <span className="text-base font-semibold">Vào cổng Người dùng</span>
          <span className="mt-0.5 text-sm text-indigo-100">
            Bí thư · Chi Đoàn · Phụ huynh / Học sinh
          </span>
        </Link>
      </div>

      <p className="text-xs text-slate-400">
        <Link href="/gioi-thieu" className="hover:text-slate-600 hover:underline">
          Tìm hiểu thêm về hệ thống →
        </Link>
      </p>
    </main>
  );
}
