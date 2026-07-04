import { Badge, Button, Card } from "@/components/ui";
import { PageHeader } from "@/components/layout";
import { STUDENTS, neighborhoodName } from "@/lib/mock";

export default function SecretaryStudentsPage() {
  return (
    <>
      <PageHeader
        title="Học sinh"
        description="Danh sách học sinh trong Khu phố phụ trách. Thêm/sửa sẽ bật ở phase CRUD thật."
      />

      <div className="mb-4 flex items-center justify-between gap-3">
        <p className="text-sm text-slate-500">
          {STUDENTS.length} học sinh (dữ liệu demo)
        </p>
        <Button disabled variant="secondary" className="h-9 px-3 text-xs">
          + Thêm học sinh (chưa kết nối)
        </Button>
      </div>

      <Card className="p-0">
        <ul className="divide-y divide-slate-100">
          {STUDENTS.map((s) => (
            <li key={s.id} className="flex items-center justify-between gap-3 px-4 py-3">
              <div className="min-w-0">
                <p className="truncate font-medium text-slate-900">{s.fullName}</p>
                <p className="mt-0.5 truncate text-xs text-slate-500">
                  Sinh {s.birthYear} · {neighborhoodName(s.neighborhoodCode)} · PH: {s.guardianName} ({s.guardianPhone})
                </p>
              </div>
              <Badge tone={s.active ? "green" : "slate"}>
                {s.active ? "Đang học" : "Ngừng"}
              </Badge>
            </li>
          ))}
        </ul>
      </Card>
    </>
  );
}
