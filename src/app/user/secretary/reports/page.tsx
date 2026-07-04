import { Badge, Button, Card } from "@/components/ui";
import { PageHeader } from "@/components/layout";

const REPORTS = [
  {
    title: "Danh sách điểm danh theo buổi",
    desc: "Xuất bảng điểm danh một buổi sinh hoạt (có mặt / có phép / không phép).",
  },
  {
    title: "Tổng hợp nghỉ theo tháng",
    desc: "Thống kê số buổi nghỉ có phép / không phép của từng em trong tháng.",
  },
  {
    title: "Báo cáo buổi chung nhiều Khu phố",
    desc: "Tổng hợp tham gia buổi chung theo từng Khu phố.",
  },
];

export default function SecretaryReportsPage() {
  return (
    <>
      <PageHeader
        title="Báo cáo"
        description="Xuất báo cáo DOCX theo mẫu Admin quản lý. Render server-side bật ở phase DOCX."
      />

      <div className="grid gap-3 sm:grid-cols-2">
        {REPORTS.map((r) => (
          <Card key={r.title}>
            <div className="flex items-start justify-between gap-2">
              <p className="font-medium text-slate-900">{r.title}</p>
              <Badge tone="slate">DOCX</Badge>
            </div>
            <p className="mt-1 text-sm text-slate-500">{r.desc}</p>
            <Button disabled variant="secondary" className="mt-3 h-9 px-3 text-xs">
              Xuất DOCX (chưa kết nối)
            </Button>
          </Card>
        ))}
      </div>
    </>
  );
}
