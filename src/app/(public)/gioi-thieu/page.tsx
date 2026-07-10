import Link from "next/link";

/**
 * Trang công khai (route group `(public)`) — không yêu cầu đăng nhập.
 * Phase 1: nội dung giới thiệu tối giản.
 */
export default function AboutPage() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-12">
      <h1 className="text-2xl font-semibold text-slate-900">
        Về hệ thống điểm danh sinh hoạt hè
      </h1>
      <p className="mt-3 text-sm leading-6 text-slate-600">
        Ứng dụng mobile-first thay thế điểm danh giấy: quản lý học sinh theo Khu
        phố, lập buổi sinh hoạt, điểm danh nhanh, xử lý xin phép nghỉ và xuất báo
        cáo. Dữ liệu trẻ em/học sinh được bảo vệ bằng phân quyền theo Khu phố và
        RLS ở tầng cơ sở dữ liệu.
      </p>
      <div className="mt-6 flex flex-wrap gap-3">
        <Link
          href="/user/login"
          className="text-sm font-medium text-indigo-600 hover:underline"
        >
          Đăng nhập Người dùng →
        </Link>
      </div>
      <p className="mt-4 text-xs text-slate-400">
        Cổng quản trị dành cho người được phân quyền và truy cập riêng theo đường dẫn quản trị.
      </p>
    </main>
  );
}
