import { Badge, Card } from "@/components/ui";
import { PageHeader } from "@/components/layout";
import { listSecretaries } from "@/lib/data/admin";

export const dynamic = "force-dynamic";

export default async function AdminSecretariesPage() {
  const secretaries = await listSecretaries();

  return (
    <>
      <PageHeader
        title="Bí thư"
        description="Tài khoản Bí thư (dữ liệu thật). Tạo/khóa/reset mật khẩu sẽ bật ở prompt CRUD Admin."
      />
      <p className="mb-2 text-sm text-slate-500">{secretaries.length} tài khoản</p>
      <Card className="p-0">
        {secretaries.length === 0 ? (
          <p className="px-4 py-6 text-center text-sm text-slate-500">
            Chưa có Bí thư nào. Chạy bootstrap để tạo tài khoản mẫu.
          </p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {secretaries.map((s) => (
              <li
                key={s.id}
                className="flex items-center justify-between gap-3 px-4 py-3"
              >
                <div className="min-w-0">
                  <p className="font-medium text-slate-900">{s.full_name}</p>
                  <p className="mt-0.5 truncate text-xs text-slate-500">
                    {s.phone ?? "—"}
                    {s.email ? ` · ${s.email}` : ""}
                  </p>
                </div>
                <Badge tone={s.active ? "green" : "slate"}>
                  {s.active ? "Hoạt động" : "Đã khóa"}
                </Badge>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </>
  );
}
