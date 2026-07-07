import { Badge, Card } from "@/components/ui";
import { PageHeader } from "@/components/layout";
import { listParents, listStudentsBrief } from "@/lib/data/admin";
import { CreateParentForm } from "./CreateParentForm";
import { ResetPasswordButton } from "../ResetPasswordButton";
import { setAccountActive } from "../account-actions";
import { linkStudent, unlinkStudent } from "./actions";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function one(v: string | string[] | undefined): string {
  return Array.isArray(v) ? (v[0] ?? "") : (v ?? "");
}

export default async function AdminParentsPage({ searchParams }: PageProps) {
  const q = one((await searchParams).q);
  const [parents, students] = await Promise.all([listParents(q), listStudentsBrief()]);

  return (
    <>
      <PageHeader
        title="Phụ huynh / Học sinh"
        description="Tạo tài khoản phụ huynh, liên kết với học sinh, đặt lại mật khẩu tạm, khóa hoặc mở khóa. Liên kết học sinh sẽ mở khóa cổng Phụ huynh."
      />

      <CreateParentForm />

      <form method="get" className="mb-3">
        <input
          name="q"
          defaultValue={q}
          placeholder="Tìm theo họ tên hoặc số điện thoại…"
          className="h-10 w-full max-w-sm rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
        />
      </form>

      <p className="mb-2 text-sm text-slate-500">
        {parents.length} tài khoản{q ? ` khớp “${q}”` : ""}
      </p>
      <div className="grid gap-3">
        {parents.length === 0 ? (
          <Card>
            <p className="text-sm text-slate-500">
              {q ? "Không có tài khoản nào khớp tìm kiếm." : "Chưa có tài khoản phụ huynh nào."}
            </p>
          </Card>
        ) : (
          parents.map(({ profile, students: linked }) => {
            const linkedIds = new Set(linked.map((s) => s.id));
            const available = students.filter((s) => !linkedIds.has(s.id));
            return (
              <Card key={profile.id}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium text-slate-900">{profile.full_name}</p>
                      <Badge tone="indigo">Phụ huynh</Badge>
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
                  <p className="mb-1.5 text-xs font-medium text-slate-600">Học sinh liên kết</p>
                  <div className="flex flex-wrap items-center gap-2">
                    {linked.length === 0 ? (
                      <span className="text-xs text-slate-400">Chưa liên kết học sinh nào.</span>
                    ) : (
                      linked.map((s) => (
                        <form key={s.id} action={unlinkStudent} className="inline-flex">
                          <input type="hidden" name="parent_id" value={profile.id} />
                          <input type="hidden" name="student_id" value={s.id} />
                          <button
                            type="submit"
                            title="Bỏ liên kết"
                            className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs text-slate-700 hover:bg-rose-50 hover:text-rose-700"
                          >
                            {s.full_name} ✕
                          </button>
                        </form>
                      ))
                    )}
                  </div>
                  {available.length > 0 ? (
                    <form action={linkStudent} className="mt-2 flex items-center gap-2">
                      <input type="hidden" name="parent_id" value={profile.id} />
                      <select
                        name="student_id"
                        defaultValue={available[0].id}
                        className="h-8 max-w-[220px] rounded-lg border border-slate-200 px-2 text-xs"
                      >
                        {available.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.full_name}
                          </option>
                        ))}
                      </select>
                      <button
                        type="submit"
                        className="rounded-md bg-indigo-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-indigo-700"
                      >
                        + Liên kết
                      </button>
                    </form>
                  ) : (
                    <p className="mt-2 text-xs text-slate-400">
                      Không còn học sinh để liên kết (tạo học sinh ở cổng Bí thư).
                    </p>
                  )}
                </div>
              </Card>
            );
          })
        )}
      </div>
    </>
  );
}
