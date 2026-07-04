import { Card } from "@/components/ui";
import { PageHeader } from "@/components/layout";

export default function AdminDashboard() {
  return (
    <>
      <PageHeader
        title="Tổng quan hệ thống"
        description="Quản lý tài khoản Bí thư, Khu phố, audit log và cấu hình an toàn."
      />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card title="Bí thư">
          <p className="text-2xl font-semibold text-slate-900">—</p>
        </Card>
        <Card title="Khu phố">
          <p className="text-2xl font-semibold text-slate-900">—</p>
        </Card>
        <Card title="Học sinh">
          <p className="text-2xl font-semibold text-slate-900">—</p>
        </Card>
        <Card title="Sự kiện audit gần đây">
          <p className="text-2xl font-semibold text-slate-900">—</p>
        </Card>
      </div>
      <p className="mt-6 text-xs text-slate-400">
        Phase 1: KPI card là placeholder. Dữ liệu thật nối ở Phase 3+.
      </p>
    </>
  );
}
