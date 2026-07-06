import { Badge, Card } from "@/components/ui";
import { PageHeader } from "@/components/layout";
import { listAudit } from "@/lib/data/admin";

export const dynamic = "force-dynamic";

const ACTION_LABEL: Record<string, string> = {
  CREATE_STAFF: "Tạo Bí thư/Chi Đoàn",
  CREATE_PARENT: "Tạo phụ huynh",
  RESET_PASSWORD: "Reset mật khẩu",
  LOCK_ACCOUNT: "Khóa tài khoản",
  UNLOCK_ACCOUNT: "Mở khóa tài khoản",
  ASSIGN_NEIGHBORHOOD: "Gán Khu phố",
  UNASSIGN_NEIGHBORHOOD: "Bỏ gán Khu phố",
  LINK_PARENT_STUDENT: "Liên kết phụ huynh–học sinh",
  UNLINK_PARENT_STUDENT: "Bỏ liên kết",
  CREATE_TEMPLATE: "Tạo mẫu báo cáo",
  TOGGLE_TEMPLATE: "Bật/tắt mẫu báo cáo",
};

export default async function AdminAuditPage() {
  const rows = await listAudit();

  return (
    <>
      <PageHeader
        title="Lịch sử thao tác (audit log)"
        description="Ghi nhận các thao tác quản trị nhạy cảm. Chỉ đọc, không sửa/xóa (append-only)."
      />

      <Card className="p-0">
        {rows.length === 0 ? (
          <p className="px-4 py-6 text-center text-sm text-slate-500">
            Chưa có bản ghi nào. Các thao tác quản trị sẽ được ghi tại đây.
          </p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {rows.map((r) => (
              <li key={r.id} className="flex items-start justify-between gap-3 px-4 py-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-900">
                    {ACTION_LABEL[r.action] ?? r.action}
                  </p>
                  <p className="mt-0.5 truncate text-xs text-slate-500">
                    {r.actorName}
                    {r.actorRole ? ` · ${r.actorRole}` : ""}
                    {r.entity ? ` · ${r.entity}` : ""}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <Badge tone="slate">{r.createdAt.slice(0, 16).replace("T", " ")}</Badge>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <p className="mt-4 text-xs text-slate-400">
        Append-only: audit_logs không có policy update/delete. Không ghi mật khẩu/token vào log.
      </p>
    </>
  );
}
