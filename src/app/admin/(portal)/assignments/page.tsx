import { Badge, Card } from "@/components/ui";
import { PageHeader } from "@/components/layout";
import { listAssignments } from "@/lib/data/admin";

export const dynamic = "force-dynamic";

export default async function AdminAssignmentsPage() {
  const assignments = await listAssignments();

  return (
    <>
      <PageHeader
        title="Gán Bí thư ↔ Khu phố"
        description="Phân công phụ trách (dữ liệu thật). Gán/gỡ thao tác sẽ bật ở prompt CRUD Admin."
      />
      <p className="mb-2 text-sm text-slate-500">{assignments.length} phân công</p>
      <Card className="p-0">
        {assignments.length === 0 ? (
          <p className="px-4 py-6 text-center text-sm text-slate-500">
            Chưa có phân công nào.
          </p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {assignments.map((a) => (
              <li
                key={a.id}
                className="flex items-center justify-between gap-3 px-4 py-3"
              >
                <span className="font-medium text-slate-900">
                  {a.secretaryName}
                </span>
                <Badge tone="indigo">
                  {a.neighborhoodName} ({a.neighborhoodCode})
                </Badge>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </>
  );
}
