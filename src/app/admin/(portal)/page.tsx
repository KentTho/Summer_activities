import Link from "next/link";
import { Card, StatCard } from "@/components/ui";
import { PageHeader } from "@/components/layout";
import { getAdminOverview } from "@/lib/data/admin";
import { countPendingPasswordRequests } from "@/lib/data/password-requests";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const [o, pendingResets] = await Promise.all([
    getAdminOverview(),
    countPendingPasswordRequests(),
  ]);

  return (
    <>
      <PageHeader
        title="Tổng quan hệ thống"
        description="Số liệu thật từ cơ sở dữ liệu: Khu phố, Bí thư, học sinh, buổi sinh hoạt."
      />

      {pendingResets > 0 ? (
        <Link
          href="/admin/password-requests"
          className="mb-4 flex items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm hover:bg-amber-100"
        >
          <span className="font-medium text-amber-800">
            🔑 {pendingResets} yêu cầu đặt lại mật khẩu đang chờ xử lý
          </span>
          <span className="text-amber-700">Xử lý ngay →</span>
        </Link>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Khu phố"
          value={o.neighborhoods}
          hint={`${o.activeNeighborhoods} đang hoạt động`}
        />
        <StatCard label="Bí thư / Chi Đoàn" value={o.secretaries} hint="Cán bộ phụ trách" />
        <StatCard label="Phụ huynh" value={o.parents} hint="Tài khoản đã tạo" />
        <StatCard label="Học sinh" value={o.students} hint="Chưa xóa mềm" />
        <StatCard label="Buổi sinh hoạt" value={o.sessions} hint="Tổng đã tạo" />
        <StatCard label="Buổi hôm nay" value={o.sessionsToday} hint="Theo lịch" />
        <StatCard label="Đơn nghỉ chờ" value={o.pendingLeave} hint="Cần Bí thư xử lý" />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <Card title="Tài khoản & phân công">
          <ul className="space-y-2 text-sm">
            <li>
              <Link href="/admin/secretaries" className="text-indigo-600 hover:underline">
                Bí thư / Chi Đoàn →
              </Link>
            </li>
            <li>
              <Link href="/admin/parents" className="text-indigo-600 hover:underline">
                Phụ huynh / Học sinh →
              </Link>
            </li>
            <li>
              <Link href="/admin/neighborhoods" className="text-indigo-600 hover:underline">
                Khu phố →
              </Link>
            </li>
            <li>
              <Link href="/admin/assignments" className="text-indigo-600 hover:underline">
                Phân công phụ trách →
              </Link>
            </li>
          </ul>
        </Card>
        <Card title="Vận hành">
          <ul className="space-y-2 text-sm">
            <li>
              <Link href="/admin/sessions" className="text-indigo-600 hover:underline">
                Buổi sinh hoạt (tổng quan) →
              </Link>
            </li>
            <li>
              <Link href="/admin/templates" className="text-indigo-600 hover:underline">
                Mẫu báo cáo DOCX →
              </Link>
            </li>
            <li>
              <Link href="/admin/audit" className="text-indigo-600 hover:underline">
                Lịch sử thao tác →
              </Link>
            </li>
          </ul>
        </Card>
        <Card title="Ghi chú">
          <p className="text-sm text-slate-500">
            Tạo tài khoản dùng mật khẩu tạm (bắt đổi lần đầu). Khóa tài khoản =
            deactivate (không xóa cứng). Mọi thao tác được ghi audit.
          </p>
        </Card>
      </div>
    </>
  );
}
