import { Badge, Card } from "@/components/ui";
import { PageHeader } from "@/components/layout";
import { listPasswordResetRequests } from "@/lib/data/password-requests";
import { ResolveRequestButton } from "./ResolveRequestButton";
import { rejectPasswordRequest } from "./actions";

export const dynamic = "force-dynamic";

const PORTAL_LABEL: Record<string, string> = { ADMIN: "Quản trị", USER: "Người dùng" };
const STATUS_TONE: Record<string, "amber" | "green" | "slate"> = {
  PENDING: "amber",
  RESOLVED: "green",
  REJECTED: "slate",
};
const STATUS_LABEL: Record<string, string> = {
  PENDING: "Chờ xử lý",
  RESOLVED: "Đã cấp lại",
  REJECTED: "Đã từ chối",
};

export default async function AdminPasswordRequestsPage() {
  const requests = await listPasswordResetRequests();
  const pending = requests.filter((r) => r.status === "PENDING");
  const others = requests.filter((r) => r.status !== "PENDING");

  return (
    <>
      <PageHeader
        title="Yêu cầu đặt lại mật khẩu"
        description="Người dùng quên mật khẩu gửi yêu cầu tại đây. Cấp mật khẩu tạm (bắt buộc đổi lần đầu) hoặc từ chối yêu cầu rác. Hệ thống không gửi email/SMS."
      />

      {pending.length > 0 ? (
        <p className="mb-3 rounded-lg bg-amber-50 px-3 py-2 text-sm font-medium text-amber-800">
          Có {pending.length} yêu cầu đang chờ xử lý.
        </p>
      ) : (
        <p className="mb-3 text-sm text-slate-500">Không có yêu cầu nào đang chờ.</p>
      )}

      <div className="grid gap-3">
        {[...pending, ...others].map((r) => (
          <Card key={r.id}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-medium text-slate-900">{r.identifier}</p>
                  <Badge tone="indigo">{PORTAL_LABEL[r.portal] ?? r.portal}</Badge>
                  <Badge tone={STATUS_TONE[r.status] ?? "slate"}>
                    {STATUS_LABEL[r.status] ?? r.status}
                  </Badge>
                  {r.matched_profile_id ? (
                    <Badge tone="green">Đã khớp hồ sơ</Badge>
                  ) : (
                    <Badge tone="slate">Chưa khớp hồ sơ</Badge>
                  )}
                </div>
                <p className="mt-0.5 text-xs text-slate-500">
                  Gửi lúc {new Date(r.created_at).toLocaleString("vi-VN")}
                  {r.requested_role ? ` · vai trò dự kiến: ${r.requested_role}` : ""}
                </p>
              </div>
              {r.status === "PENDING" ? (
                <div className="flex flex-wrap items-center gap-2">
                  <ResolveRequestButton requestId={r.id} />
                  <form action={rejectPasswordRequest}>
                    <input type="hidden" name="request_id" value={r.id} />
                    <button
                      type="submit"
                      className="rounded-md px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50"
                    >
                      Từ chối
                    </button>
                  </form>
                </div>
              ) : null}
            </div>
          </Card>
        ))}
        {requests.length === 0 ? (
          <Card>
            <p className="text-sm text-slate-500">Chưa có yêu cầu nào.</p>
          </Card>
        ) : null}
      </div>
    </>
  );
}
