import { Badge, Button, Card, StatCard } from "@/components/ui";
import { PageHeader } from "@/components/layout";
import { ADMIN_STATS } from "@/lib/mock";

const SYSTEM_REPORTS = [
  { title: "Tổng hợp điểm danh toàn hệ thống", desc: "Tỉ lệ có mặt / nghỉ theo Khu phố trong kỳ." },
  { title: "Hoạt động của Bí thư", desc: "Số buổi, số lần điểm danh, đơn nghỉ đã xử lý theo Bí thư." },
  { title: "Thống kê Khu phố", desc: "Số học sinh, số buổi, độ phủ Bí thư theo từng Khu phố." },
];

export default function AdminReportsPage() {
  return (
    <>
      <PageHeader
        title="Báo cáo tổng hợp hệ thống"
        description="Báo cáo cấp quản trị toàn hệ thống. Xuất DOCX render server-side bật ở phase DOCX."
      />

      <div className="mb-4 grid gap-4 sm:grid-cols-3">
        <StatCard label="Khu phố" value={ADMIN_STATS.neighborhoods} />
        <StatCard label="Bí thư" value={ADMIN_STATS.secretaries} />
        <StatCard label="Học sinh" value={ADMIN_STATS.students} />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {SYSTEM_REPORTS.map((r) => (
          <Card key={r.title}>
            <div className="flex items-start justify-between gap-2">
              <p className="font-medium text-slate-900">{r.title}</p>
              <Badge tone="slate">DOCX</Badge>
            </div>
            <p className="mt-1 text-sm text-slate-500">{r.desc}</p>
            <Button disabled variant="secondary" className="mt-3 h-9 px-3 text-xs">
              Xuất DOCX (chưa kết nối)
            </Button>
          </Card>
        ))}
      </div>
    </>
  );
}
