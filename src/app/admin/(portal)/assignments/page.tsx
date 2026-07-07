import { Badge, Card } from "@/components/ui";
import { PageHeader } from "@/components/layout";
import {
  listNeighborhoodAssignments,
  listSecretaries,
  type AssignmentStaff,
} from "@/lib/data/admin";
import {
  assignNeighborhood,
  unassignNeighborhood,
  setAssignmentRole,
} from "../secretaries/actions";

export const dynamic = "force-dynamic";

function StaffRow({
  staff,
  neighborhoodId,
  isPrimary,
}: {
  staff: AssignmentStaff;
  neighborhoodId: string;
  isPrimary: boolean;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-slate-50 px-3 py-2">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-medium text-slate-800">{staff.name}</span>
        <Badge tone="indigo">{staff.staffTitle ?? "Bí thư"}</Badge>
        {!staff.active ? <Badge tone="slate">Đã khóa</Badge> : null}
      </div>
      <div className="flex items-center gap-1.5">
        {isPrimary ? (
          <form action={setAssignmentRole}>
            <input type="hidden" name="secretary_id" value={staff.secretaryId} />
            <input type="hidden" name="neighborhood_id" value={neighborhoodId} />
            <input type="hidden" name="assignment_role" value="COORDINATING" />
            <button
              type="submit"
              className="rounded-md px-2 py-1 text-xs font-medium text-slate-600 hover:bg-slate-200"
            >
              Chuyển thành phối hợp
            </button>
          </form>
        ) : (
          <form action={setAssignmentRole}>
            <input type="hidden" name="secretary_id" value={staff.secretaryId} />
            <input type="hidden" name="neighborhood_id" value={neighborhoodId} />
            <input type="hidden" name="assignment_role" value="PRIMARY" />
            <button
              type="submit"
              className="rounded-md px-2 py-1 text-xs font-medium text-indigo-600 hover:bg-indigo-50"
            >
              Đặt làm chính
            </button>
          </form>
        )}
        <form action={unassignNeighborhood}>
          <input type="hidden" name="secretary_id" value={staff.secretaryId} />
          <input type="hidden" name="neighborhood_id" value={neighborhoodId} />
          <button
            type="submit"
            title="Bỏ phân công"
            className="rounded-md px-2 py-1 text-xs font-medium text-rose-600 hover:bg-rose-50"
          >
            Gỡ
          </button>
        </form>
      </div>
    </div>
  );
}

export default async function AdminAssignmentsPage() {
  const [neighborhoods, secretaries] = await Promise.all([
    listNeighborhoodAssignments(),
    listSecretaries(),
  ]);

  return (
    <>
      <PageHeader
        title="Phân công phụ trách"
        description="Gán Bí thư / Chi Đoàn vào từng Khu phố với vai trò rõ ràng: mỗi Khu phố tối đa một Phụ trách chính và nhiều Phụ trách chung / phối hợp."
      />

      {neighborhoods.length === 0 ? (
        <Card>
          <p className="text-sm text-slate-500">
            Chưa có Khu phố nào. Thêm Khu phố ở mục “Khu phố” trước khi phân công.
          </p>
        </Card>
      ) : (
        <div className="grid gap-3">
          {neighborhoods.map((n) => {
            const assignedIds = new Set<string>([
              ...(n.primary ? [n.primary.secretaryId] : []),
              ...n.coordinators.map((c) => c.secretaryId),
            ]);
            const available = secretaries.filter((s) => !assignedIds.has(s.id));
            return (
              <Card key={n.neighborhoodId}>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-medium text-slate-900">{n.name}</p>
                  <Badge tone="slate">{n.code}</Badge>
                  {!n.active ? <Badge tone="slate">Ngừng hoạt động</Badge> : null}
                </div>

                <div className="mt-3 space-y-3">
                  <div>
                    <p className="mb-1.5 text-xs font-medium text-slate-600">Phụ trách chính</p>
                    {n.primary ? (
                      <StaffRow staff={n.primary} neighborhoodId={n.neighborhoodId} isPrimary />
                    ) : (
                      <p className="text-xs text-amber-600">Chưa có Phụ trách chính.</p>
                    )}
                  </div>

                  <div>
                    <p className="mb-1.5 text-xs font-medium text-slate-600">
                      Phụ trách chung / phối hợp
                    </p>
                    {n.coordinators.length === 0 ? (
                      <p className="text-xs text-slate-400">Chưa có phụ trách phối hợp.</p>
                    ) : (
                      <div className="space-y-1.5">
                        {n.coordinators.map((c) => (
                          <StaffRow
                            key={c.secretaryId}
                            staff={c}
                            neighborhoodId={n.neighborhoodId}
                            isPrimary={false}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {available.length > 0 ? (
                  <form
                    action={assignNeighborhood}
                    className="mt-3 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3"
                  >
                    <input type="hidden" name="neighborhood_id" value={n.neighborhoodId} />
                    <select
                      name="secretary_id"
                      defaultValue={available[0].id}
                      className="h-8 rounded-lg border border-slate-200 px-2 text-xs"
                    >
                      {available.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.full_name}
                          {s.staff_title ? ` (${s.staff_title})` : ""}
                        </option>
                      ))}
                    </select>
                    <select
                      name="assignment_role"
                      defaultValue="COORDINATING"
                      className="h-8 rounded-lg border border-slate-200 px-2 text-xs"
                    >
                      <option value="COORDINATING">Phụ trách chung</option>
                      <option value="PRIMARY">Phụ trách chính</option>
                    </select>
                    <button
                      type="submit"
                      className="rounded-md bg-indigo-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-indigo-700"
                    >
                      + Phân công
                    </button>
                  </form>
                ) : (
                  <p className="mt-3 border-t border-slate-100 pt-3 text-xs text-slate-400">
                    Mọi Bí thư / Chi Đoàn đã được phân công vào Khu phố này.
                  </p>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </>
  );
}
