import { Badge, Card, StatCard } from "@/components/ui";
import { PageHeader } from "@/components/layout";
import { ADMIN_STUDENTS_PAGE_SIZES, listAllStudents, listNeighborhoodsDetailed } from "@/lib/data/admin";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function one(v: string | string[] | undefined): string {
  return Array.isArray(v) ? (v[0] ?? "") : (v ?? "");
}

const field =
  "h-10 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100";

function pageHref(base: Record<string, string>, page: number): string {
  const params = new URLSearchParams({ ...base, page: String(page) });
  return `?${params.toString()}`;
}

export default async function AdminStudentsOverviewPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const q = one(sp.q);
  const nb = one(sp.nb);
  const status = (one(sp.status) || "active") as "active" | "inactive" | "all";
  const pageSize = Number(one(sp.pageSize)) || 50;
  const page = Number(one(sp.page)) || 1;

  const [neighborhoods, result] = await Promise.all([
    listNeighborhoodsDetailed(),
    listAllStudents({ q, neighborhoodId: nb || undefined, status, page, pageSize }),
  ]);

  const baseParams: Record<string, string> = {
    q,
    nb,
    status,
    pageSize: String(result.pageSize),
  };
  const from = result.total === 0 ? 0 : (result.page - 1) * result.pageSize + 1;
  const to = Math.min(result.page * result.pageSize, result.total);

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
        <select name="pageSize" defaultValue={String(result.pageSize)} className={field}>
          {ADMIN_STUDENTS_PAGE_SIZES.map((n) => (
            <option key={n} value={n}>
              {n}/trang
            </option>
          ))}
        </select>
        {/* Đổi bộ lọc thì quay về trang 1. */}
        <input type="hidden" name="page" value="1" />
        <button type="submit" className="h-10 rounded-lg bg-indigo-600 px-4 text-sm font-medium text-white hover:bg-indigo-700">
          Lọc
        </button>
      </form>

      <p className="mb-2 text-sm text-slate-500">
        {result.total === 0
          ? "Không có học sinh nào khớp"
          : `Đang xem ${from}–${to} / ${result.total} học sinh`}
        {q ? ` khớp “${q}”` : ""}
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

      {result.totalPages > 1 ? (
        <div className="mt-3 flex items-center justify-between gap-2">
          {result.page > 1 ? (
            <a href={pageHref(baseParams, result.page - 1)} className="rounded-lg bg-slate-100 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-200">
              ← Trước
            </a>
          ) : (
            <span className="rounded-lg bg-slate-50 px-3 py-1.5 text-sm text-slate-300">← Trước</span>
          )}
          <span className="text-xs text-slate-500">
            Trang {result.page}/{result.totalPages}
          </span>
          {result.page < result.totalPages ? (
            <a href={pageHref(baseParams, result.page + 1)} className="rounded-lg bg-slate-100 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-200">
              Sau →
            </a>
          ) : (
            <span className="rounded-lg bg-slate-50 px-3 py-1.5 text-sm text-slate-300">Sau →</span>
          )}
        </div>
      ) : null}

      <p className="mt-4 text-xs text-slate-400">
        Admin chỉ xem tổng quan (RLS cho phép is_admin đọc toàn hệ thống). Nghiệp vụ CRUD học sinh
        thuộc phạm vi Khu phố của Bí thư.
      </p>
    </>
  );
}
