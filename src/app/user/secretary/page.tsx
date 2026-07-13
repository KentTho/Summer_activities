import Link from "next/link";
import { Badge, Card, EmptyState, StatCard } from "@/components/ui";
import { PageHeader } from "@/components/layout";
import { getSecretaryOverview } from "@/lib/data/secretary-dashboard";
import { SESSION_TYPE_LABEL, SESSION_TONE } from "@/modules/sessions/domain/session-type";

export const dynamic = "force-dynamic";

export default async function SecretaryDashboard() {
  const o = await getSecretaryOverview();
  const nextSession = o.upcomingSessions[0];

  return (
    <>
      <PageHeader
        title="Bảng điều khiển Bí thư"
        description="Tổng quan trong phạm vi Khu phố phụ trách (dữ liệu thật từ hệ thống)."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Học sinh đang học"
          value={o.activeStudents}
          hint={`Tổng ${o.totalStudents} hồ sơ`}
        />
        <StatCard
          label="Buổi hôm nay"
          value={o.todaySessions.length}
          hint={o.toMarkToday > 0 ? `${o.toMarkToday} em cần điểm danh` : "Đã điểm danh xong"}
        />
        <StatCard label="Đơn chờ xử lý" value={o.pendingLeaveCount} hint="Xin phép nghỉ" />
        <StatCard
          label="Tỉ lệ tham gia tháng"
          value={o.attendanceRateThisMonth === null ? "—" : `${o.attendanceRateThisMonth}%`}
          hint={
            o.attendanceRateThisMonth === null
              ? "Chưa có dữ liệu"
              : `CM ${o.monthPresent} · CP ${o.monthExcused} · KP ${o.monthUnexcused}`
          }
        />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Card title="Buổi hôm nay">
          {o.todaySessions.length === 0 ? (
            <EmptyState icon="📅" title="Hôm nay không có buổi nào" />
          ) : (
            <ul className="divide-y divide-slate-100">
              {o.todaySessions.map((s) => (
                <li key={s.id} className="flex items-center justify-between gap-3 py-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-slate-900">{s.title}</p>
                    <p className="text-xs text-slate-500">
                      {s.start_time ? s.start_time.slice(0, 5) : ""}
                      {s.location ? ` · ${s.location}` : ""}
                    </p>
                  </div>
                  <Link
                    href={`/user/secretary/sessions/${s.id}`}
                    className="shrink-0 text-sm font-medium text-indigo-600 hover:underline"
                  >
                    {s.closed_at ? "Xem →" : "Điểm danh →"}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card title="Buổi sắp tới">
          {o.upcomingSessions.length === 0 ? (
            <EmptyState icon="🗓️" title="Chưa có buổi nào sắp tới" />
          ) : (
            <ul className="divide-y divide-slate-100">
              {o.upcomingSessions.map((s) => (
                <li key={s.id} className="flex items-center justify-between gap-3 py-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-slate-900">{s.title}</p>
                    <p className="text-xs text-slate-500">
                      {s.session_date}
                      {s.start_time ? ` · ${s.start_time.slice(0, 5)}` : ""}
                    </p>
                  </div>
                  <Badge tone={SESSION_TONE[s.session_type]}>
                    {SESSION_TYPE_LABEL[s.session_type]}
                  </Badge>
                </li>
              ))}
            </ul>
          )}
          <div className="mt-4 flex flex-wrap gap-4 text-sm">
            <Link href="/user/secretary/sessions" className="font-medium text-indigo-600 hover:underline">
              Quản lý buổi →
            </Link>
            <Link href="/user/secretary/operations?tab=leave" className="font-medium text-indigo-600 hover:underline">
              Đơn & thông báo →
            </Link>
          </div>
        </Card>
      </div>

      <p className="mt-4 text-xs text-slate-400">
        {nextSession ? `Buổi kế tiếp: ${nextSession.title} · ${nextSession.session_date}` : ""}
      </p>
    </>
  );
}
