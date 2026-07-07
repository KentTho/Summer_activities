import { Badge, Card } from "@/components/ui";
import { PageHeader } from "@/components/layout";
import { listNeighborhoodsDetailed } from "@/lib/data/admin";
import { CreateNeighborhoodForm } from "./CreateNeighborhoodForm";
import { updateNeighborhood, setNeighborhoodActive } from "./actions";

export const dynamic = "force-dynamic";

const field =
  "h-9 w-full rounded-lg border border-slate-200 px-2.5 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100";

export default async function AdminNeighborhoodsPage() {
  const neighborhoods = await listNeighborhoodsDetailed();
  const activeCount = neighborhoods.filter((n) => n.active).length;

  return (
    <>
      <PageHeader
        title="Khu phố"
        description="Danh mục Khu phố kèm số học sinh, số cán bộ phụ trách và số buổi sinh hoạt. Ngừng hoạt động thay cho xóa khi Khu phố đã có dữ liệu."
      />

      <CreateNeighborhoodForm />

      <p className="mb-2 text-sm text-slate-500">
        {neighborhoods.length} Khu phố · {activeCount} đang hoạt động
      </p>

      {neighborhoods.length === 0 ? (
        <Card>
          <p className="text-sm text-slate-500">Chưa có Khu phố nào. Thêm Khu phố ở trên.</p>
        </Card>
      ) : (
        <div className="grid gap-3">
          {neighborhoods.map((n) => (
            <Card key={n.id}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium text-slate-900">{n.name}</p>
                    <Badge tone="slate">{n.code}</Badge>
                    <Badge tone={n.active ? "green" : "slate"}>
                      {n.active ? "Đang hoạt động" : "Ngừng hoạt động"}
                    </Badge>
                  </div>
                  <p className="mt-1 text-xs text-slate-500">
                    Phụ trách chính:{" "}
                    {n.primaryName ? (
                      <span className="font-medium text-slate-700">{n.primaryName}</span>
                    ) : (
                      <span className="text-amber-600">chưa phân công</span>
                    )}
                  </p>
                </div>
                <form action={setNeighborhoodActive}>
                  <input type="hidden" name="id" value={n.id} />
                  <input type="hidden" name="active" value={(!n.active).toString()} />
                  <button
                    type="submit"
                    className={
                      "rounded-md px-2 py-1 text-xs font-medium " +
                      (n.active
                        ? "text-red-600 hover:bg-red-50"
                        : "text-green-700 hover:bg-green-50")
                    }
                  >
                    {n.active ? "Ngừng hoạt động" : "Kích hoạt lại"}
                  </button>
                </form>
              </div>

              <div className="mt-3 flex flex-wrap gap-4 border-t border-slate-100 pt-3 text-xs text-slate-600">
                <span>
                  Học sinh: <b className="text-slate-900">{n.studentCount}</b>
                </span>
                <span>
                  Cán bộ phụ trách: <b className="text-slate-900">{n.staffCount}</b>
                </span>
                <span>
                  Buổi sinh hoạt: <b className="text-slate-900">{n.sessionCount}</b>
                </span>
              </div>

              <details className="mt-2 text-sm">
                <summary className="cursor-pointer text-xs font-medium text-indigo-600 hover:text-indigo-700">
                  Sửa thông tin
                </summary>
                <form
                  action={updateNeighborhood}
                  className="mt-2 grid gap-2 sm:grid-cols-[1fr_2fr_auto] sm:items-end"
                >
                  <input type="hidden" name="id" value={n.id} />
                  <div>
                    <label className="mb-1 block text-[11px] font-medium text-slate-500">Mã</label>
                    <input name="code" required defaultValue={n.code} className={field} />
                  </div>
                  <div>
                    <label className="mb-1 block text-[11px] font-medium text-slate-500">Tên</label>
                    <input name="name" required defaultValue={n.name} className={field} />
                  </div>
                  <button
                    type="submit"
                    className="h-9 rounded-md bg-indigo-600 px-3 text-xs font-medium text-white hover:bg-indigo-700"
                  >
                    Lưu
                  </button>
                </form>
              </details>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
