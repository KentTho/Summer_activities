import { Badge, Card } from "@/components/ui";
import { PageHeader } from "@/components/layout";
import { listActiveTemplates } from "@/lib/data/templates";
import { listSessions } from "@/lib/data/sessions";

export const dynamic = "force-dynamic";

const linkBtn =
  "inline-flex h-9 items-center rounded-lg bg-indigo-600 px-3 text-xs font-medium text-white hover:bg-indigo-700";
const linkBtnGhost =
  "inline-flex h-9 items-center rounded-lg bg-slate-100 px-3 text-xs font-medium text-slate-700 hover:bg-slate-200";

export default async function SecretaryReportsPage() {
  const [templates, sessions] = await Promise.all([listActiveTemplates(), listSessions(30)]);

  return (
    <>
      <PageHeader
        title="Báo cáo"
        description="Xuất báo cáo DOCX cho học sinh và điểm danh trong phạm vi phụ trách. Tệp được tạo trên máy chủ."
      />

      <Card title="Xuất nhanh" className="mb-4">
        <p className="mb-3 text-sm text-slate-500">
          Tệp DOCX tạo theo dữ liệu thật trong phạm vi Khu phố bạn phụ trách.
        </p>
        <a href="/user/secretary/reports/students" className={linkBtn}>
          Xuất danh sách học sinh (DOCX)
        </a>
      </Card>

      <p className="mb-2 text-sm font-medium text-slate-700">Báo cáo điểm danh theo buổi</p>
      <Card className="mb-4 p-0">
        {sessions.length === 0 ? (
          <p className="px-4 py-6 text-center text-sm text-slate-500">
            Chưa có buổi sinh hoạt nào. Tạo buổi ở mục Buổi sinh hoạt.
          </p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {sessions.map(({ session, neighborhoods, counts }) => (
              <li key={session.id} className="flex items-center justify-between gap-3 px-4 py-3">
                <div className="min-w-0">
                  <p className="truncate font-medium text-slate-900">{session.title}</p>
                  <p className="mt-0.5 truncate text-xs text-slate-500">
                    {session.session_date}
                    {neighborhoods.length > 0 ? ` · ${neighborhoods.map((n) => n.name).join(", ")}` : ""}
                    {` · đã điểm danh ${counts.marked}`}
                  </p>
                </div>
                <a
                  href={`/user/secretary/reports/attendance?session=${session.id}`}
                  className={linkBtnGhost}
                >
                  Xuất điểm danh (DOCX)
                </a>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <p className="mb-2 text-sm font-medium text-slate-700">Mẫu báo cáo do Quản trị duyệt</p>
      {templates.length === 0 ? (
        <Card>
          <p className="text-sm text-slate-500">
            Chưa có mẫu báo cáo nào được bật. Admin quản lý mẫu ở cổng Quản trị.
          </p>
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {templates.map((t) => (
            <Card key={t.id}>
              <div className="flex items-start justify-between gap-2">
                <p className="font-medium text-slate-900">{t.name}</p>
                <Badge tone="slate">DOCX</Badge>
              </div>
              <p className="mt-1 text-sm text-slate-500">
                Đổ danh sách học sinh vào mẫu này (nếu mẫu có placeholder). Không có placeholder sẽ tự dùng mẫu chuẩn.
              </p>
              <a href={`/user/secretary/reports/students?template=${t.id}`} className={`${linkBtnGhost} mt-3`}>
                Xuất DS học sinh theo mẫu
              </a>
            </Card>
          ))}
        </div>
      )}
      <p className="mt-3 text-xs text-slate-400">
        Placeholder hỗ trợ trong mẫu: <code>{"{{report_title}}"}</code>, <code>{"{{generated_at}}"}</code>,{" "}
        <code>{"{{neighborhood_name}}"}</code>, <code>{"{{students_text}}"}</code>,{" "}
        <code>{"{{attendance_text}}"}</code>…
      </p>
    </>
  );
}
