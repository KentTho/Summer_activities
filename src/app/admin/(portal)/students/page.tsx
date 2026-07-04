import { Badge, Card, StatCard } from "@/components/ui";
import { PageHeader } from "@/components/layout";
import { ADMIN_NEIGHBORHOODS, ADMIN_STATS } from "@/lib/mock";

export default function AdminStudentsOverviewPage() {
  return (
    <>
      <PageHeader
        title="Học sinh — tổng quan hệ thống"
        description="Góc nhìn tổng hợp theo Khu phố (chỉ xem). Thêm/sửa học sinh thực hiện ở cổng Bí thư."
      />

      <div className="mb-4 grid gap-4 sm:grid-cols-3">
        <StatCard label="Tổng học sinh" value={ADMIN_STATS.students} />
        <StatCard label="Khu phố có học sinh" value={ADMIN_NEIGHBORHOODS.filter((n) => n.studentCount > 0).length} />
        <StatCard label="Khu phố trống" value={ADMIN_NEIGHBORHOODS.filter((n) => n.studentCount === 0).length} />
      </div>

      <p className="mb-2 text-sm font-medium text-slate-700">Phân bổ theo Khu phố</p>
      <Card className="p-0">
        <ul className="divide-y divide-slate-100">
          {ADMIN_NEIGHBORHOODS.map((n) => (
            <li key={n.code} className="flex items-center justify-between gap-3 px-4 py-3">
              <div>
                <p className="font-medium text-slate-900">{n.name}</p>
                <p className="mt-0.5 text-xs text-slate-500">{n.secretaryCount} Bí thư phụ trách</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-lg font-semibold text-slate-900">{n.studentCount}</span>
                <Badge tone={n.active ? "green" : "slate"}>{n.active ? "Hoạt động" : "Ngừng"}</Badge>
              </div>
            </li>
          ))}
        </ul>
      </Card>

      <p className="mt-4 text-xs text-slate-400">
        Admin chỉ xem tổng quan toàn hệ thống. Nghiệp vụ CRUD học sinh thuộc phạm vi
        Khu phố của Bí thư (RLS sẽ chặn ở phase DB thật).
      </p>
    </>
  );
}
