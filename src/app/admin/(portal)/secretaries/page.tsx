import { Badge, Button, Card } from "@/components/ui";
import { PageHeader } from "@/components/layout";
import { SECRETARIES, neighborhoodName } from "@/lib/mock";

export default function AdminSecretariesPage() {
  return (
    <>
      <PageHeader
        title="Quản lý Bí thư"
        description="Tài khoản Bí thư do Admin tạo (không tự đăng ký). Tạo/khóa/reset mật khẩu bật ở phase auth."
      />

      <div className="mb-4 flex items-center justify-between gap-3">
        <p className="text-sm text-slate-500">{SECRETARIES.length} tài khoản (dữ liệu demo)</p>
        <Button disabled variant="secondary" className="h-9 px-3 text-xs">
          + Tạo Bí thư (chưa kết nối)
        </Button>
      </div>

      <div className="grid gap-3">
        {SECRETARIES.map((s) => (
          <Card key={s.id}>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-medium text-slate-900">{s.fullName}</p>
                <p className="mt-0.5 truncate text-xs text-slate-500">
                  {s.email} · {s.phone} · tạo {s.createdAt}
                </p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {s.neighborhoodCodes.length === 0 ? (
                    <Badge tone="amber">Chưa gán Khu phố</Badge>
                  ) : (
                    s.neighborhoodCodes.map((code) => (
                      <Badge key={code} tone="indigo">{neighborhoodName(code)}</Badge>
                    ))
                  )}
                </div>
              </div>
              <div className="flex flex-col items-end gap-2">
                <Badge tone={s.active ? "green" : "slate"}>
                  {s.active ? "Hoạt động" : "Đã khóa"}
                </Badge>
                <div className="flex gap-1">
                  <Button disabled variant="ghost" className="h-8 px-2 text-xs">Sửa</Button>
                  <Button disabled variant="ghost" className="h-8 px-2 text-xs">Reset MK</Button>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </>
  );
}
