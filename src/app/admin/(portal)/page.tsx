import Link from "next/link";
import { Card, StatCard } from "@/components/ui";
import { PageHeader } from "@/components/layout";
import { getAdminOverview } from "@/lib/data/admin";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const o = await getAdminOverview();

  return (
    <>
      <PageHeader
        title="Tổng quan hệ thống"
        description="Số liệu thật từ cơ sở dữ liệu: Khu phố, Bí thư, học sinh, buổi sinh hoạt."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Khu phố"
          value={o.neighborhoods}
          hint={`${o.activeNeighborhoods} đang hoạt động`}
        />
        <StatCard label="Bí thư" value={o.secretaries} hint="Vai trò SECRETARY" />
        <StatCard
          label="Học sinh (toàn hệ thống)"
          value={o.students}
          hint="Chưa xóa mềm"
        />
        <StatCard label="Buổi sinh hoạt" value={o.sessions} hint="Tổng đã tạo" />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <Card title="Danh mục & phân công">
          <ul className="space-y-2 text-sm">
            <li>
              <Link href="/admin/neighborhoods" className="text-indigo-600 hover:underline">
                Khu phố →
              </Link>
            </li>
            <li>
              <Link href="/admin/secretaries" className="text-indigo-600 hover:underline">
                Bí thư →
              </Link>
            </li>
            <li>
              <Link href="/admin/assignments" className="text-indigo-600 hover:underline">
                Gán phụ trách →
              </Link>
            </li>
          </ul>
        </Card>
        <Card title="Ghi chú">
          <p className="text-sm text-slate-500">
            Trang Khu phố/Bí thư/Phân công hiển thị dữ liệu thật (chỉ đọc). CRUD Admin
            đầy đủ sẽ bổ sung ở prompt sau.
          </p>
        </Card>
      </div>
    </>
  );
}
