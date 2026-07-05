import Link from "next/link";
import { Badge, Card, StatCard } from "@/components/ui";
import { PageHeader } from "@/components/layout";
import { getSecretaryOverview } from "@/lib/data/secretary-dashboard";
import { SESSION_TYPE_LABEL } from "@/modules/sessions/domain/session-type";

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
          label="Buổi sắp tới"
          value={o.upcomingSessions.length}
          hint={nextSession ? `Gần nhất: ${nextSession.session_date}` : "Chưa có lịch"}
        />
        <StatCard
          label="Đơn chờ xử lý"
          value={o.pendingLeaveCount}
          hint="Xin phép nghỉ"
        />
        <StatCard
          label="Tỉ lệ điểm danh tháng"
          value={o.attendanceRateThisMonth === null ? "—" : `${o.attendanceRateThisMonth}%`}
          hint={o.attendanceRateThisMonth === null ? "Chưa có dữ liệu" : "Có mặt / tổng"}
        />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Card title="Buổi sinh hoạt sắp tới">
          {o.upcomingSessions.length === 0 ? (
            <p className="text-sm text-slate-500">Chưa có buổi nào được lên lịch.</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {o.upcomingSessions.map((s) => (
                <li
                  key={s.id}
                  className="flex items-center justify-between gap-3 py-2"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-slate-900">
                      {s.title}
                    </p>
                    <p className="text-xs text-slate-500">
                      {s.session_date}
                      {s.start_time ? ` · ${s.start_time}` : ""}
                      {s.location ? ` · ${s.location}` : ""}
                    </p>
                  </div>
                  <Badge tone="blue">{SESSION_TYPE_LABEL[s.session_type]}</Badge>
                </li>
              ))}
            </ul>
          )}
          <Link
            href="/user/secretary/attendance"
            className="mt-4 inline-block text-sm font-medium text-indigo-600 hover:underline"
          >
            Vào điểm danh →
          </Link>
        </Card>

        <Card title="Lối tắt">
          <ul className="space-y-2 text-sm">
            <li>
              <Link
                href="/user/secretary/students"
                className="font-medium text-indigo-600 hover:underline"
              >
                Quản lý học sinh →
              </Link>
            </li>
            <li>
              <Link
                href="/user/secretary/import"
                className="font-medium text-indigo-600 hover:underline"
              >
                Nhập giấy tờ (staging) →
              </Link>
            </li>
            <li>
              <Link
                href="/user/secretary/leave-requests"
                className="font-medium text-indigo-600 hover:underline"
              >
                Đơn xin nghỉ →
              </Link>
            </li>
          </ul>
        </Card>
      </div>
    </>
  );
}
