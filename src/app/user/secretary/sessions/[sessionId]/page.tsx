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
import { closeSession, reopenSession } from "../actions";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ sessionId: string }>;
}

export default async function SessionDetailPage({ params }: PageProps) {
  const { sessionId } = await params;
  const detail = await getSessionDetail(sessionId);
  if (!detail) notFound();

  const roster = await getSessionRoster(sessionId);
  const closed = Boolean(detail.session.closed_at);

  const present = roster.filter((r) => r.status === "PRESENT").length;
  const excused = roster.filter((r) => r.status === "EXCUSED").length;
  const unexcused = roster.filter((r) => r.status === "UNEXCUSED").length;
  const notMarked = roster.filter((r) => r.status === null).length;

  return (
    <>
      <PageHeader
        title={detail.session.title}
        description="Điểm danh từng em. Sửa được khi buổi đang mở; chốt buổi để khóa."
      />

      <div className="mb-4 flex flex-wrap items-center gap-3 text-sm text-slate-500">
        <Link href="/user/secretary/sessions" className="text-indigo-600 hover:underline">
          ← Danh sách buổi
        </Link>
        <Badge tone={SESSION_TONE[detail.session.session_type]}>
          {SESSION_TYPE_LABEL[detail.session.session_type]}
        </Badge>
        <Badge tone={closed ? "slate" : "green"}>{closed ? "Đã chốt" : "Đang mở"}</Badge>
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

      <div className="mb-4 flex justify-end">
        {closed ? (
          <form action={reopenSession}>
            <input type="hidden" name="session_id" value={sessionId} />
            <button
              type="submit"
              className="inline-flex h-9 items-center rounded-lg bg-slate-100 px-4 text-sm font-medium text-slate-700 hover:bg-slate-200"
            >
              Mở lại buổi
            </button>
          </form>
        ) : (
          <form action={closeSession}>
            <input type="hidden" name="session_id" value={sessionId} />
            <button
              type="submit"
              className="inline-flex h-9 items-center rounded-lg bg-green-600 px-4 text-sm font-semibold text-white hover:bg-green-700"
            >
              Chốt buổi
            </button>
          </form>
        )}
      </div>

      <Card className="p-0">
        {roster.length === 0 ? (
          <p className="px-4 py-6 text-center text-sm text-slate-500">
            Không có học sinh nào thuộc Khu phố của buổi này.
          </p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {roster.map((r) => (
              <li
                key={r.studentId}
                className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex items-center gap-3">
                  <span className="font-medium text-slate-900">{r.fullName}</span>
                  {r.status ? (
                    <Badge tone={ATTENDANCE_TONE[r.status]}>
                      {ATTENDANCE_STATUS_LABEL[r.status]}
                    </Badge>
                  ) : (
                    <Badge tone="slate">Chưa điểm danh</Badge>
                  )}
                </div>
                {!closed ? (
                  <div className="flex flex-wrap gap-1.5">
                    {MARK_OPTIONS.map((opt) => {
                      const active =
                        opt.value === (r.status ?? NOT_MARKED);
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
