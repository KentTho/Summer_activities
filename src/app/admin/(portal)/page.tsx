import Link from "next/link";
import { Badge, Card, StatCard } from "@/components/ui";
import { PageHeader } from "@/components/layout";
import { ADMIN_STATS, AUDIT_LOGS, SESSIONS } from "@/lib/mock";

export default function AdminDashboard() {
  const recentAudits = AUDIT_LOGS.slice(0, 4);
  const alerts =
    ADMIN_STATS.unassignedNeighborhoods.length +
    ADMIN_STATS.unassignedSecretaries.length;

  return (
    <>
      <PageHeader
        title="Tổng quan hệ thống"
        description="Quản trị Khu phố, Bí thư, gán phụ trách, mẫu báo cáo, cấu hình và audit log."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Khu phố" value={ADMIN_STATS.neighborhoods} hint={`${ADMIN_STATS.activeNeighborhoods} đang hoạt động`} />
        <StatCard label="Bí thư" value={ADMIN_STATS.secretaries} hint={`${ADMIN_STATS.activeSecretaries} đang hoạt động`} />
        <StatCard label="Học sinh (toàn hệ thống)" value={ADMIN_STATS.students} hint="Tổng hợp theo Khu phố" />
        <StatCard label="Buổi sinh hoạt" value={SESSIONS.length} hint="Tuần hiện tại" />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Card title={`Cần xử lý (${alerts})`}>
          {alerts === 0 ? (
            <p className="text-sm text-slate-500">Không có cảnh báo phân công.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {ADMIN_STATS.unassignedNeighborhoods.map((n) => (
                <li key={n.code} className="flex items-center justify-between gap-2">
                  <span className="text-slate-700">
                    {n.name} chưa có Bí thư phụ trách
                  </span>
                  <Badge tone="amber">Thiếu Bí thư</Badge>
                </li>
              ))}
              {ADMIN_STATS.unassignedSecretaries.map((s) => (
                <li key={s.id} className="flex items-center justify-between gap-2">
                  <span className="text-slate-700">
                    {s.fullName} chưa được gán Khu phố
                  </span>
                  <Badge tone="slate">Chưa gán</Badge>
                </li>
              ))}
            </ul>
          )}
          <Link
            href="/admin/assignments"
            className="mt-4 inline-block text-sm font-medium text-indigo-600 hover:underline"
          >
            Quản lý gán phụ trách →
          </Link>
        </Card>

        <Card title="Hoạt động gần đây (audit)">
          <ul className="divide-y divide-slate-100">
            {recentAudits.map((a) => (
              <li key={a.id} className="py-2 text-sm">
                <p className="text-slate-700">
                  <span className="font-medium">{a.actorName}</span> · {a.action}
                </p>
                <p className="text-xs text-slate-400">{a.at} · {a.detail}</p>
              </li>
            ))}
          </ul>
          <Link
            href="/admin/audit"
            className="mt-3 inline-block text-sm font-medium text-indigo-600 hover:underline"
          >
            Xem toàn bộ audit log →
          </Link>
        </Card>
      </div>
    </>
  );
}
