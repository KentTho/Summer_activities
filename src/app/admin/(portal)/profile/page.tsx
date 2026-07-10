import { Card } from "@/components/ui";
import { PageHeader } from "@/components/layout";
import { getMyProfileDetails } from "@/lib/data/profile";
import { ProfileForm } from "@/components/profile/ProfileForm";

export const dynamic = "force-dynamic";

export default async function AdminProfilePage() {
  const me = await getMyProfileDetails();
  if (!me) return null;

  return (
    <>
      <PageHeader title="Thông tin cá nhân" description="Quản lý thông tin tài khoản Quản trị viên." />
      <Card title="Vai trò" className="mb-4">
        <p className="text-sm text-slate-700">Quản trị viên (ADMIN)</p>
      </Card>
      <Card title="Cập nhật thông tin">
        <ProfileForm fullName={me.fullName} phone={me.phone} email={me.email} />
      </Card>
    </>
  );
}
