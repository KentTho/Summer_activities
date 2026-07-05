import Link from "next/link";
import { Badge, Card } from "@/components/ui";
import { PageHeader } from "@/components/layout";
import {
  listStudents,
  listNeighborhoodsInScope,
  listSchoolsInScope,
  type StudentStatusFilter,
} from "@/lib/data/students";
import { StudentForm } from "./StudentForm";
import { softDeleteStudent } from "./actions";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function one(v: string | string[] | undefined): string {
  return Array.isArray(v) ? (v[0] ?? "") : (v ?? "");
}

export default async function SecretaryStudentsPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const q = one(sp.q);
  const neighborhoodId = one(sp.neighborhood);
  const school = one(sp.school);
  const status = (one(sp.status) || "active") as StudentStatusFilter;
  const editId = one(sp.edit);

  const [students, neighborhoods, schools] = await Promise.all([
    listStudents({ q, neighborhoodId, school, status }),
    listNeighborhoodsInScope(),
    listSchoolsInScope(),
  ]);

  const editing = editId ? students.find((s) => s.id === editId) : undefined;
  const nbName = (id: string) =>
    neighborhoods.find((n) => n.id === id)?.name ?? "—";

  return (
    <>
      <PageHeader
        title="Học sinh"
        description="Quản lý học sinh trong Khu phố phụ trách: thêm, sửa, xóa mềm, tìm kiếm và lọc."
      />

      {neighborhoods.length === 0 ? (
        <Card className="mb-4 border-amber-200 bg-amber-50">
          <p className="text-sm text-amber-800">
            Bạn chưa được gán Khu phố phụ trách. Liên hệ Quản trị viên để được phân
            công trước khi thêm học sinh.
          </p>
        </Card>
      ) : (
        <StudentForm
          key={editing?.id ?? "create"}
          mode={editing ? "edit" : "create"}
          neighborhoods={neighborhoods}
          student={editing}
        />
      )}

      {/* Bộ lọc (GET form — không cần JS) */}
      <form method="get" className="mt-6 grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
        <input
          name="q"
          defaultValue={q}
          placeholder="Tìm theo họ tên…"
          className="h-10 rounded-lg border border-slate-200 px-3 text-sm sm:col-span-2"
        />
        <select
          name="neighborhood"
          defaultValue={neighborhoodId}
          className="h-10 rounded-lg border border-slate-200 px-2 text-sm"
        >
          <option value="">Tất cả Khu phố</option>
          {neighborhoods.map((n) => (
            <option key={n.id} value={n.id}>
              {n.name}
            </option>
          ))}
        </select>
        <select
          name="school"
          defaultValue={school}
          className="h-10 rounded-lg border border-slate-200 px-2 text-sm"
        >
          <option value="">Tất cả trường</option>
          {schools.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <select
          name="status"
          defaultValue={status}
          className="h-10 rounded-lg border border-slate-200 px-2 text-sm"
        >
          <option value="active">Đang học</option>
          <option value="inactive">Ngừng</option>
          <option value="all">Tất cả trạng thái</option>
        </select>
        <div className="flex gap-2 sm:col-span-2 lg:col-span-5">
          <button
            type="submit"
            className="h-9 rounded-lg bg-slate-800 px-4 text-sm font-medium text-white hover:bg-slate-700"
          >
            Lọc
          </button>
          <Link
            href="/user/secretary/students"
            className="inline-flex h-9 items-center rounded-lg px-3 text-sm text-slate-500 hover:bg-slate-100"
          >
            Xóa lọc
          </Link>
        </div>
      </form>

      <p className="mt-4 mb-2 text-sm text-slate-500">{students.length} học sinh</p>

      <Card className="p-0">
        {students.length === 0 ? (
          <p className="px-4 py-6 text-center text-sm text-slate-500">
            Không có học sinh phù hợp bộ lọc.
          </p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {students.map((s) => (
              <li
                key={s.id}
                className="flex items-center justify-between gap-3 px-4 py-3"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium text-slate-900">
                    {s.full_name}
                  </p>
                  <p className="mt-0.5 truncate text-xs text-slate-500">
                    {s.birth_date ? `Sinh ${s.birth_date} · ` : ""}
                    {nbName(s.neighborhood_id)}
                    {s.school ? ` · ${s.school}` : ""}
                    {s.guardian_phone ? ` · PH: ${s.guardian_phone}` : ""}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <Badge tone={s.active ? "green" : "slate"}>
                    {s.active ? "Đang học" : "Ngừng"}
                  </Badge>
                  <Link
                    href={`?edit=${s.id}`}
                    className="rounded-md px-2 py-1 text-xs font-medium text-indigo-600 hover:bg-indigo-50"
                  >
                    Sửa
                  </Link>
                  <form action={softDeleteStudent}>
                    <input type="hidden" name="id" value={s.id} />
                    <button
                      type="submit"
                      className="rounded-md px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50"
                    >
                      Xóa
                    </button>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </>
  );
}
