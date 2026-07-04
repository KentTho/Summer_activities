import { Badge, Button, Card } from "@/components/ui";
import { PageHeader } from "@/components/layout";
import { ADMIN_NEIGHBORHOODS } from "@/lib/mock";

export default function AdminNeighborhoodsPage() {
  return (
    <>
      <PageHeader
        title="Quản lý Khu phố"
        description="Trục phân quyền lõi. Mỗi học sinh gắn đúng một Khu phố gốc. CRUD bật ở phase sau."
      />

      <div className="mb-4 flex items-center justify-between gap-3">
        <p className="text-sm text-slate-500">{ADMIN_NEIGHBORHOODS.length} Khu phố (dữ liệu demo)</p>
        <Button disabled variant="secondary" className="h-9 px-3 text-xs">
          + Thêm Khu phố (chưa kết nối)
        </Button>
      </div>

      <Card className="p-0">
        <ul className="divide-y divide-slate-100">
          {ADMIN_NEIGHBORHOODS.map((n) => (
            <li key={n.code} className="flex items-center justify-between gap-3 px-4 py-3">
              <div className="min-w-0">
                <p className="font-medium text-slate-900">
                  {n.name} <span className="text-xs font-normal text-slate-400">({n.code})</span>
                </p>
                <p className="mt-0.5 text-xs text-slate-500">
                  {n.studentCount} học sinh · {n.secretaryCount} Bí thư phụ trách
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge tone={n.active ? "green" : "slate"}>
                  {n.active ? "Hoạt động" : "Tạm ngừng"}
                </Badge>
                <Button disabled variant="ghost" className="h-8 px-2 text-xs">Sửa</Button>
              </div>
            </li>
          ))}
        </ul>
      </Card>
    </>
  );
}
