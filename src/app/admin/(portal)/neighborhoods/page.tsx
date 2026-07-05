import { Badge, Card } from "@/components/ui";
import { PageHeader } from "@/components/layout";
import { listNeighborhoods } from "@/lib/data/admin";

export const dynamic = "force-dynamic";

export default async function AdminNeighborhoodsPage() {
  const neighborhoods = await listNeighborhoods();

  return (
    <>
      <PageHeader
        title="Khu phố"
        description="Danh mục Khu phố (dữ liệu thật). Thêm/sửa sẽ bật ở prompt CRUD Admin."
      />
      <p className="mb-2 text-sm text-slate-500">{neighborhoods.length} Khu phố</p>
      <Card className="p-0">
        {neighborhoods.length === 0 ? (
          <p className="px-4 py-6 text-center text-sm text-slate-500">
            Chưa có Khu phố nào. Chạy bootstrap hoặc thêm ở prompt CRUD Admin.
          </p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {neighborhoods.map((n) => (
              <li
                key={n.id}
                className="flex items-center justify-between gap-3 px-4 py-3"
              >
                <div>
                  <p className="font-medium text-slate-900">{n.name}</p>
                  <p className="text-xs text-slate-500">Mã: {n.code}</p>
                </div>
                <Badge tone={n.active ? "green" : "slate"}>
                  {n.active ? "Hoạt động" : "Ngừng"}
                </Badge>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </>
  );
}
