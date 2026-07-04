import { Button, Card } from "@/components/ui";
import { PageHeader } from "@/components/layout";
import { SYSTEM_SETTINGS } from "@/lib/mock";

const FIELDS: { label: string; key: keyof typeof SYSTEM_SETTINGS; hint: string }[] = [
  { label: "Tên hệ thống", key: "systemName", hint: "Hiển thị trên tiêu đề & báo cáo" },
  { label: "Logo (URL)", key: "logoUrl", hint: "Ảnh trong bucket cho phép" },
  { label: "Màu chủ đạo", key: "primaryColor", hint: "Mã màu hợp lệ (vd #4f46e5)" },
  { label: "Chân trang", key: "footerText", hint: "Văn bản chân trang" },
];

export default function AdminSettingsPage() {
  return (
    <>
      <PageHeader
        title="Cấu hình hệ thống"
        description="Chỉ các trường an toàn trong whitelist. Không có ô nhập CSS/JS/HTML tùy ý (spec §7)."
      />

      <Card>
        <div className="space-y-4">
          {FIELDS.map((f) => (
            <div key={f.key}>
              <label className="mb-1 block text-sm font-medium text-slate-700">{f.label}</label>
              <input
                type="text"
                disabled
                defaultValue={SYSTEM_SETTINGS[f.key]}
                className="h-11 w-full rounded-lg border border-slate-200 px-3 text-sm text-slate-600 outline-none disabled:bg-slate-50"
              />
              <p className="mt-1 text-xs text-slate-400">{f.hint}</p>
            </div>
          ))}
          <div className="flex justify-end">
            <Button disabled className="h-9 px-4 text-sm">Lưu cấu hình (chưa kết nối)</Button>
          </div>
        </div>
      </Card>

      <p className="mt-4 text-xs text-slate-400">
        Danh sách field bị giới hạn bằng whitelist ở <code>lib/security</code>; mọi thay
        đổi cấu hình sẽ ghi audit khi làm thật.
      </p>
    </>
  );
}
