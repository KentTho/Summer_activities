import { Badge, Card } from "@/components/ui";
import { PageHeader } from "@/components/layout";
import { listStaff, listNeighborhoods, ASSIGNMENT_ROLE_LABEL } from "@/lib/data/admin";
import { CreateStaffForm } from "./CreateStaffForm";
import { ResetPasswordButton } from "../ResetPasswordButton";
import { setAccountActive } from "../account-actions";
import { assignNeighborhood, unassignNeighborhood } from "./actions";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function one(v: string | string[] | undefined): string {
  return Array.isArray(v) ? (v[0] ?? "") : (v ?? "");
}

export default async function AdminSecretariesPage({ searchParams }: PageProps) {
  const q = one((await searchParams).q);
  const [staff, neighborhoods] = await Promise.all([listStaff(q), listNeighborhoods()]);
  const activeNeighborhoods = neighborhoods.filter((n) => n.active);

  return (
    <>
      <PageHeader
        title="Bí thư / Chi Đoàn"
        description="Tạo tài khoản, phân công Khu phố (chính / phối hợp), đặt lại mật khẩu tạm, khóa hoặc mở khóa. Hai chức danh dùng chung quyền của cán bộ (SECRETARY)."
      />

      <CreateStaffForm />

      <form method="get" className="mb-3">
        <input
          name="q"
          defaultValue={q}
          placeholder="Tìm theo họ tên hoặc số điện thoại…"
          className="h-10 w-full max-w-sm rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
        />
      </form>

      <p className="mb-2 text-sm text-slate-500">
        {staff.length} tài khoản{q ? ` khớp “${q}”` : ""}
      </p>
      <div className="grid gap-3">
        {staff.length === 0 ? (
          <Card>
            <p className="text-sm text-slate-500">
              {q ? "Không có tài khoản nào khớp tìm kiếm." : "Chưa có tài khoản nào."}
            </p>
          </Card>
        ) : (
          staff.map(({ profile, neighborhoods: assigned }) => {
            const assignedIds = new Set(assigned.map((n) => n.id));
            const available = activeNeighborhoods.filter((n) => !assignedIds.has(n.id));
            return (
              <Card key={profile.id}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium text-slate-900">{profile.full_name}</p>
                      <Badge tone="indigo">{profile.staff_title ?? "Bí thư"}</Badge>
                      <Badge tone={profile.active ? "green" : "slate"}>
                        {profile.active ? "Đang hoạt động" : "Đã khóa"}
                      </Badge>
                    </div>
                    <p className="mt-0.5 truncate text-xs text-slate-500">
                      {profile.phone ?? "—"}
                      {profile.email ? ` · ${profile.email}` : ""}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <ResetPasswordButton profileId={profile.id} />
                    <form action={setAccountActive}>
                      <input type="hidden" name="profile_id" value={profile.id} />
                      <input type="hidden" name="active" value={(!profile.active).toString()} />
                      <button
                        type="submit"
                        className={
                          "rounded-md px-2 py-1 text-xs font-medium " +
                          (profile.active
                            ? "text-red-600 hover:bg-red-50"
                            : "text-green-700 hover:bg-green-50")
                        }
                      >
                        {profile.active ? "Khóa" : "Mở khóa"}
                      </button>
                    </form>
                  </div>
                </div>

                <div className="mt-3 border-t border-slate-100 pt-3">
                  <p className="mb-1.5 text-xs font-medium text-slate-600">Khu phố phụ trách</p>
                  <div className="flex flex-wrap items-center gap-2">
                    {assigned.length === 0 ? (
                      <span className="text-xs text-slate-400">Chưa phân công Khu phố nào.</span>
                    ) : (
                      assigned.map((n) => (
                        <form key={n.id} action={unassignNeighborhood} className="inline-flex">
                          <input type="hidden" name="secretary_id" value={profile.id} />
                          <input type="hidden" name="neighborhood_id" value={n.id} />
                          <button
                            type="submit"
                            title="Bỏ phân công"
                            className={
                              "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs hover:bg-rose-50 hover:text-rose-700 " +
                              (n.assignmentRole === "PRIMARY"
                                ? "bg-indigo-100 text-indigo-700"
                                : "bg-slate-100 text-slate-700")
                            }
                          >
                            {n.name}
                            <span className="opacity-70">· {ASSIGNMENT_ROLE_LABEL[n.assignmentRole]}</span>
                            <span aria-hidden>✕</span>
                          </button>
                        </form>
                      ))
                    )}
                  </div>
                  {available.length > 0 ? (
                    <form action={assignNeighborhood} className="mt-2 flex flex-wrap items-center gap-2">
                      <input type="hidden" name="secretary_id" value={profile.id} />
                      <select
                        name="neighborhood_id"
                        defaultValue={available[0].id}
                        className="h-8 rounded-lg border border-slate-200 px-2 text-xs"
                      >
                        {available.map((n) => (
                          <option key={n.id} value={n.id}>
                            {n.name}
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
                  ) : null}
                </div>
              </Card>
            );
          })
        )}
      </div>
    </>
  );
}
