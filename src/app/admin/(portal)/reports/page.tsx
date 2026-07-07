import { Badge, Card, StatCard } from "@/components/ui";
import { PageHeader } from "@/components/layout";
import { getAdminOverview, listNeighborhoodsDetailed } from "@/lib/data/admin";

export const dynamic = "force-dynamic";

export default async function AdminReportsPage() {
  const [overview, neighborhoods] = await Promise.all([
    getAdminOverview(),
    listNeighborhoodsDetailed(),
  ]);

  return (
    <>
      <PageHeader
        title="Báo cáo tổng hợp hệ thống"
        description="Số liệu toàn hệ thống theo thời gian thực. Xuất DOCX render trên máy chủ."
      />

      <div className="mb-4 grid gap-4 sm:grid-cols-3">
        <StatCard label="Khu phố" value={overview.neighborhoods} />
        <StatCard label="Cán bộ phụ trách" value={overview.secretaries} />
        <StatCard label="Học sinh" value={overview.students} />
      </div>
      <div className="mb-4 grid gap-4 sm:grid-cols-3">
        <StatCard label="Buổi sinh hoạt" value={overview.sessions} />
        <StatCard label="Phụ huynh" value={overview.parents} />
        <StatCard label="Đơn nghỉ chờ xử lý" value={overview.pendingLeave} />
      </div>

      <Card title="Xuất báo cáo tổng hợp" className="mb-4">
        <p className="mb-3 text-sm text-slate-500">
          Tệp DOCX gồm số liệu tổng hợp và thống kê theo từng Khu phố.
        </p>
        <a
          href="/admin/reports/system"
          className="inline-flex h-9 items-center rounded-lg bg-indigo-600 px-3 text-xs font-medium text-white hover:bg-indigo-700"
        >
          Xuất DOCX tổng hợp
        </a>
      </Card>

      <p className="mb-2 text-sm font-medium text-slate-700">Thống kê theo Khu phố</p>
      <Card className="p-0">
        <ul className="divide-y divide-slate-100">
          {neighborhoods.map((n) => (
            <li key={n.id} className="flex items-center justify-between gap-3 px-4 py-3">
              <div className="min-w-0">
                <p className="truncate font-medium text-slate-900">{n.name}</p>
                <p className="mt-0.5 truncate text-xs text-slate-500">
                  {n.studentCount} học sinh · {n.staffCount} cán bộ · {n.sessionCount} buổi
                  {n.primaryName ? ` · Chính: ${n.primaryName}` : ""}
                </p>
              </div>
              <Badge tone={n.active ? "green" : "slate"}>
                {n.active ? "Đang hoạt động" : "Ngừng"}
              </Badge>
            </li>
          ))}
        </ul>
      </Card>
    </>
  );
}
