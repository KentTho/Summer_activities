import { Badge, Card, StatCard } from "@/components/ui";
import { PageHeader } from "@/components/layout";
import { listAllStudents, listNeighborhoodsDetailed } from "@/lib/data/admin";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function one(v: string | string[] | undefined): string {
  return Array.isArray(v) ? (v[0] ?? "") : (v ?? "");
}

const field =
  "h-10 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100";

export default async function AdminStudentsOverviewPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const q = one(sp.q);
  const nb = one(sp.nb);
  const status = (one(sp.status) || "active") as "active" | "inactive" | "all";

  const [neighborhoods, result] = await Promise.all([
    listNeighborhoodsDetailed(),
    listAllStudents({ q, neighborhoodId: nb || undefined, status }),
  ]);

  const withStudents = neighborhoods.filter((n) => n.studentCount > 0).length;
  const totalStudents = neighborhoods.reduce((sum, n) => sum + n.studentCount, 0);

  return (
    <>
      <PageHeader
        title="Học sinh — tổng quan hệ thống"
        description="Xem toàn hệ thống (chỉ đọc). Thêm/sửa học sinh thực hiện ở cổng Bí thư theo Khu phố."
      />

      <div className="mb-4 grid gap-4 sm:grid-cols-3">
        <StatCard label="Tổng học sinh (đang hoạt động)" value={totalStudents} />
        <StatCard label="Khu phố có học sinh" value={withStudents} />
        <StatCard label="Khu phố trống" value={neighborhoods.length - withStudents} />
      </div>

      <form method="get" className="mb-3 flex flex-wrap items-center gap-2">
        <input name="q" defaultValue={q} placeholder="Tìm theo tên học sinh…" className={`${field} min-w-[16rem] flex-1`} />
        <select name="nb" defaultValue={nb} className={field}>
          <option value="">Tất cả Khu phố</option>
          {neighborhoods.map((n) => (
            <option key={n.id} value={n.id}>
              {n.name}
            </option>
          ))}
        </select>
        <select name="status" defaultValue={status} className={field}>
          <option value="active">Đang hoạt động</option>
          <option value="inactive">Đã ngừng</option>
          <option value="all">Tất cả</option>
        </select>
        <button type="submit" className="h-10 rounded-lg bg-indigo-600 px-4 text-sm font-medium text-white hover:bg-indigo-700">
          Lọc
        </button>
      </form>

      <p className="mb-2 text-sm text-slate-500">
        {result.rows.length} học sinh{q ? ` khớp “${q}”` : ""}
        {result.rows.length >= 500 ? " (hiển thị tối đa 500)" : ""}
      </p>
      <Card className="p-0">
        {result.rows.length === 0 ? (
          <p className="px-4 py-6 text-center text-sm text-slate-500">Không có học sinh nào khớp.</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {result.rows.map((s) => (
              <li key={s.id} className="flex items-center justify-between gap-3 px-4 py-3">
                <div className="min-w-0">
                  <p className="truncate font-medium text-slate-900">{s.fullName}</p>
                  <p className="mt-0.5 truncate text-xs text-slate-500">
                    {s.neighborhoodName}
                    {s.school ? ` · ${s.school}` : ""}
                    {s.guardianPhone ? ` · ${s.guardianPhone}` : ""}
                  </p>
                </div>
                <Badge tone={s.active ? "green" : "slate"}>{s.active ? "Hoạt động" : "Ngừng"}</Badge>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <p className="mt-4 text-xs text-slate-400">
        Admin chỉ xem tổng quan (RLS cho phép is_admin đọc toàn hệ thống). Nghiệp vụ CRUD học sinh
        thuộc phạm vi Khu phố của Bí thư.
      </p>
    </>
  );
}
