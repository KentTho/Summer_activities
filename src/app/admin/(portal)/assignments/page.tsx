import { Badge, Button, Card } from "@/components/ui";
import { PageHeader } from "@/components/layout";
import { ADMIN_NEIGHBORHOODS, SECRETARIES } from "@/lib/mock";

export default function AdminAssignmentsPage() {
  const secretariesFor = (code: string) =>
    SECRETARIES.filter((s) => s.neighborhoodCodes.includes(code));
  const unassignedSecretaries = SECRETARIES.filter(
    (s) => s.neighborhoodCodes.length === 0,
  );

  return (
    <>
      <PageHeader
        title="Gán Bí thư ↔ Khu phố"
        description="Một Bí thư có thể phụ trách nhiều Khu phố. Gán/gỡ thao tác thật bật ở phase sau."
      />

      <p className="mb-2 text-sm font-medium text-slate-700">Theo Khu phố</p>
      <div className="grid gap-3">
        {ADMIN_NEIGHBORHOODS.map((n) => {
          const assigned = secretariesFor(n.code);
          return (
            <Card key={n.code}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium text-slate-900">
                    {n.name} <span className="text-xs font-normal text-slate-400">({n.code})</span>
                  </p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {assigned.length === 0 ? (
                      <Badge tone="amber">Chưa có Bí thư</Badge>
                    ) : (
                      assigned.map((s) => (
                        <Badge key={s.id} tone="indigo">{s.fullName}</Badge>
                      ))
                    )}
                  </div>
                </div>
                <Button disabled variant="secondary" className="h-8 px-3 text-xs">
                  Gán (chưa kết nối)
                </Button>
              </div>
            </Card>
          );
        })}
      </div>

      {unassignedSecretaries.length > 0 ? (
        <Card className="mt-4 border-amber-200 bg-amber-50/40">
          <p className="text-sm font-medium text-amber-800">Bí thư chưa được gán Khu phố</p>
          <ul className="mt-2 space-y-1 text-sm text-slate-700">
            {unassignedSecretaries.map((s) => (
              <li key={s.id}>• {s.fullName} ({s.email})</li>
            ))}
          </ul>
        </Card>
      ) : null}
    </>
  );
}
