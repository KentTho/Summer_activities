import { Card } from "@/components/ui";
import { PageHeader } from "@/components/layout";

export default function SecretaryDashboard() {
  return (
    <>
      <PageHeader
        title="Bảng điều khiển Bí thư"
        description="Lịch hôm nay, số cần điểm danh và đơn xin nghỉ chờ xử lý."
      />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card title="Buổi sinh hoạt sắp tới">
          <p className="text-sm text-slate-500">Chưa có dữ liệu.</p>
        </Card>
        <Card title="Cần điểm danh">
          <p className="text-2xl font-semibold text-slate-900">—</p>
        </Card>
        <Card title="Đơn xin nghỉ chờ xử lý">
          <p className="text-2xl font-semibold text-slate-900">—</p>
        </Card>
      </div>
      <p className="mt-6 text-xs text-slate-400">
        Phase 1: khung dashboard. Nghiệp vụ điểm danh nối ở Phase 4.
      </p>
    </>
  );
}
