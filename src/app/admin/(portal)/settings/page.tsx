import { PageHeader } from "@/components/layout";
import { getSystemSettings } from "@/lib/data/admin";
import { SettingsForm } from "./SettingsForm";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  const settings = await getSystemSettings();

  return (
    <>
      <PageHeader
        title="Cấu hình hệ thống"
        description="Chỉ các trường an toàn trong whitelist. Không có ô nhập CSS/JS/HTML tùy ý (spec §7)."
      />

      <SettingsForm settings={settings} />

      <p className="mt-4 text-xs text-slate-400">
        {settings.updatedAt
          ? `Cập nhật gần nhất: ${settings.updatedAt.slice(0, 10)}. `
          : ""}
        Danh sách trường bị giới hạn bằng whitelist ở <code>lib/security</code>; mọi thay đổi được ghi audit.
      </p>
    </>
  );
}
