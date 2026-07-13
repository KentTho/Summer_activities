import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge, Card } from "@/components/ui";
import { PageHeader } from "@/components/layout";
import { getSessionDetail, getSessionRoster } from "@/lib/data/sessions";
import { SESSION_TYPE_LABEL, SESSION_TONE } from "@/modules/sessions/domain/session-type";
import { NotifyParentsForm } from "./NotifyParentsForm";
import { SessionControlsClient } from "./SessionControlsClient";
import { AttendanceRosterClient } from "./AttendanceRosterClient";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ sessionId: string }>;
}

export default async function SessionDetailPage({ params }: PageProps) {
  const { sessionId } = await params;
  const detail = await getSessionDetail(sessionId);
  if (!detail) notFound();

  // Lấy toàn bộ roster (không lọc server) — tìm kiếm/lọc do client xử lý, không reload.
  const roster = await getSessionRoster(sessionId);
  const closed = Boolean(detail.session.closed_at);
  const canceled = Boolean(detail.session.canceled_at);
  const locked = closed || canceled;

  return (
    <>
      <PageHeader
        title={detail.session.title}
        description="Điểm danh, tìm kiếm học sinh, gửi thông báo phụ huynh, dời/hủy buổi."
      />

      <div className="mb-4 flex flex-wrap items-center gap-3 text-sm text-slate-500">
        <Link href="/user/secretary/sessions" className="text-indigo-600 hover:underline">
          ← Danh sách buổi
        </Link>
        <Badge tone={SESSION_TONE[detail.session.session_type]}>
          {SESSION_TYPE_LABEL[detail.session.session_type]}
        </Badge>
        {canceled ? (
          <Badge tone="red">Đã hủy</Badge>
        ) : (
          <Badge tone={closed ? "slate" : "green"}>{closed ? "Đã chốt" : "Đang mở"}</Badge>
        )}
        <span>
          {detail.session.session_date}
          {detail.session.start_time ? ` · ${detail.session.start_time.slice(0, 5)}` : ""}
          {detail.session.location ? ` · ${detail.session.location}` : ""}
        </span>
        <span>Khu phố: {detail.neighborhoods.map((n) => n.name).join(", ") || "—"}</span>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        {/* Cột chính: điểm danh + roster (chiếm 2/3 trên desktop) */}
        <div className="xl:col-span-2">
          <Card title="Điểm danh" className="p-4">
            {locked ? (
              <p className="mb-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                Buổi {canceled ? "đã hủy" : "đã chốt"} — điểm danh ở chế độ chỉ xem.
              </p>
            ) : null}
            <AttendanceRosterClient
              sessionId={sessionId}
              initialRoster={roster.map((r) => ({
                studentId: r.studentId,
                fullName: r.fullName,
                guardianPhone: r.guardianPhone,
                status: r.status,
              }))}
              locked={locked}
            />
          </Card>
        </div>

        {/* Cột phải sticky: điều khiển buổi + gửi thông báo */}
        <div className="space-y-4 xl:sticky xl:top-20 xl:self-start">
          <Card title="Điều khiển buổi">
            <SessionControlsClient
              sessionId={sessionId}
              closed={closed}
              canceled={canceled}
              defaultDate={detail.session.session_date}
              defaultTime={detail.session.start_time?.slice(0, 5) ?? ""}
            />
          </Card>

          <NotifyParentsForm
            sessionId={sessionId}
            defaultTitle={`Thông báo buổi: ${detail.session.title}`}
          />
        </div>
      </div>
    </>
  );
}
