import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge, Card, StatCard } from "@/components/ui";
import { PageHeader } from "@/components/layout";
import { getSessionDetail, getSessionRoster } from "@/lib/data/sessions";
import { SESSION_TYPE_LABEL, SESSION_TONE } from "@/modules/sessions/domain/session-type";
import {
  ATTENDANCE_STATUS_LABEL,
  ATTENDANCE_TONE,
  MARK_OPTIONS,
  NOT_MARKED,
} from "@/modules/attendance/domain/attendance-status";
import { markAttendance } from "../../attendance/actions";
import {
  closeSession,
  reopenSession,
  cancelSession,
  uncancelSession,
  rescheduleSession,
} from "../actions";
import { NotifyParentsForm } from "./NotifyParentsForm";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ sessionId: string }>;
  searchParams: Promise<{ q?: string }>;
}

export default async function SessionDetailPage({ params, searchParams }: PageProps) {
  const { sessionId } = await params;
  const { q } = await searchParams;
  const detail = await getSessionDetail(sessionId);
  if (!detail) notFound();

  const roster = await getSessionRoster(sessionId, q);
  const closed = Boolean(detail.session.closed_at);
  const canceled = Boolean(detail.session.canceled_at);
  const locked = closed || canceled;

  const present = roster.filter((r) => r.status === "PRESENT").length;
  const excused = roster.filter((r) => r.status === "EXCUSED").length;
  const unexcused = roster.filter((r) => r.status === "UNEXCUSED").length;
  const notMarked = roster.filter((r) => r.status === null).length;

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

      <div className="mb-4 grid gap-4 sm:grid-cols-4">
        <StatCard label="Có mặt" value={present} />
        <StatCard label="Nghỉ có phép" value={excused} />
        <StatCard label="Nghỉ không phép" value={unexcused} />
        <StatCard label="Chưa điểm danh" value={notMarked} />
      </div>

      {/* Điều khiển buổi */}
      <Card title="Điều khiển buổi" className="mb-4">
        <div className="flex flex-wrap items-center gap-2">
          {!canceled && !closed ? (
            <form action={closeSession}>
              <input type="hidden" name="session_id" value={sessionId} />
              <button className="h-9 rounded-lg bg-green-600 px-4 text-sm font-semibold text-white hover:bg-green-700">
                Chốt buổi
              </button>
            </form>
          ) : null}
          {closed && !canceled ? (
            <form action={reopenSession}>
              <input type="hidden" name="session_id" value={sessionId} />
              <button className="h-9 rounded-lg bg-slate-100 px-4 text-sm font-medium text-slate-700 hover:bg-slate-200">
                Mở lại buổi
              </button>
            </form>
          ) : null}
          {!canceled ? (
            <form action={cancelSession}>
              <input type="hidden" name="session_id" value={sessionId} />
              <button className="h-9 rounded-lg bg-rose-50 px-4 text-sm font-medium text-rose-700 hover:bg-rose-100">
                Dừng / hủy buổi
              </button>
            </form>
          ) : (
            <form action={uncancelSession}>
              <input type="hidden" name="session_id" value={sessionId} />
              <button className="h-9 rounded-lg bg-slate-100 px-4 text-sm font-medium text-slate-700 hover:bg-slate-200">
                Khôi phục buổi
              </button>
            </form>
          )}
        </div>

        <form action={rescheduleSession} className="mt-3 flex flex-wrap items-end gap-2 border-t border-slate-100 pt-3">
          <input type="hidden" name="session_id" value={sessionId} />
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">Dời sang ngày</label>
            <input
              name="session_date"
              type="date"
              required
              defaultValue={detail.session.session_date}
              className="h-9 rounded-lg border border-slate-200 px-2 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">Giờ</label>
            <input
              name="start_time"
              type="time"
              defaultValue={detail.session.start_time?.slice(0, 5) ?? ""}
              className="h-9 rounded-lg border border-slate-200 px-2 text-sm"
            />
          </div>
          <button className="h-9 rounded-lg bg-indigo-600 px-4 text-sm font-medium text-white hover:bg-indigo-700">
            Dời buổi
          </button>
        </form>
      </Card>

      <NotifyParentsForm
        sessionId={sessionId}
        defaultTitle={`Thông báo buổi: ${detail.session.title}`}
      />

      {/* Tìm kiếm học sinh */}
      <form method="get" className="mb-3 flex items-center gap-2">
        <input
          name="q"
          defaultValue={q ?? ""}
          placeholder="Tìm theo tên học sinh hoặc SĐT phụ huynh…"
          className="h-10 w-full max-w-md rounded-lg border border-slate-200 px-3 text-sm"
        />
        <button className="h-10 rounded-lg bg-slate-800 px-4 text-sm font-medium text-white hover:bg-slate-700">
          Tìm
        </button>
        {q ? (
          <Link href={`/user/secretary/sessions/${sessionId}`} className="text-sm text-slate-500 hover:underline">
            Xóa lọc
          </Link>
        ) : null}
      </form>

      <Card className="p-0">
        {roster.length === 0 ? (
          <p className="px-4 py-6 text-center text-sm text-slate-500">
            {q ? "Không tìm thấy học sinh phù hợp." : "Không có học sinh nào thuộc Khu phố của buổi này."}
          </p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {roster.map((r) => (
              <li
                key={r.studentId}
                className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="min-w-0">
                    <span className="font-medium text-slate-900">{r.fullName}</span>
                    {r.guardianPhone ? (
                      <span className="ml-2 text-xs text-slate-400">PH: {r.guardianPhone}</span>
                    ) : null}
                  </div>
                  {r.status ? (
                    <Badge tone={ATTENDANCE_TONE[r.status]}>
                      {ATTENDANCE_STATUS_LABEL[r.status]}
                    </Badge>
                  ) : (
                    <Badge tone="slate">Chưa điểm danh</Badge>
                  )}
                </div>
                {!locked ? (
                  <div className="flex flex-wrap gap-1.5">
                    {MARK_OPTIONS.map((opt) => {
                      const active = opt.value === (r.status ?? NOT_MARKED);
                      return (
                        <form key={opt.value} action={markAttendance}>
                          <input type="hidden" name="session_id" value={sessionId} />
                          <input type="hidden" name="student_id" value={r.studentId} />
                          <input type="hidden" name="status" value={opt.value} />
                          <button
                            type="submit"
                            aria-pressed={active}
                            className={
                              "h-8 rounded-md px-2.5 text-xs font-medium transition-colors " +
                              (active
                                ? "bg-indigo-600 text-white"
                                : "bg-slate-100 text-slate-700 hover:bg-slate-200")
                            }
                          >
                            {opt.label}
                          </button>
                        </form>
                      );
                    })}
                  </div>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </Card>
    </>
  );
}
