import { Card } from "@/components/ui";
import { PageHeader } from "@/components/layout";

export default function ParentDashboard() {
  return (
    <>
      <PageHeader
        title="Trang phụ huynh / học sinh"
        description="Xem lịch sinh hoạt, thông báo, trạng thái điểm danh và gửi xin phép nghỉ."
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <Card title="Buổi sinh hoạt sắp tới">
          <p className="text-sm text-slate-500">Chưa có dữ liệu.</p>
        </Card>
        <Card title="Trạng thái điểm danh gần đây">
          <p className="text-sm text-slate-500">Chưa có dữ liệu.</p>
        </Card>
      </div>
      <p className="mt-6 text-xs text-slate-400">
        Phase 1: khung dashboard. Xin phép nghỉ nối ở Phase 4.
      </p>
    </>
  );
}
