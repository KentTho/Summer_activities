import { Card } from "@/components/ui";
import { PageHeader } from "@/components/layout";
import { getMyLinkedStudents, getMyProfileDetails } from "@/lib/data/profile";
import { ProfileForm } from "@/components/profile/ProfileForm";

export const dynamic = "force-dynamic";

export default async function ParentProfilePage() {
  const [me, students] = await Promise.all([getMyProfileDetails(), getMyLinkedStudents()]);
  if (!me) return null;

  return (
    <>
      <PageHeader title="Thông tin cá nhân" description="Thông tin tài khoản và học sinh liên kết." />

      <Card title="Học sinh liên kết" className="mb-4">
        {students.length === 0 ? (
          <p className="text-sm text-amber-700">
            Chưa có học sinh liên kết. Vui lòng liên hệ Bí thư/Quản trị để liên kết tài khoản.
          </p>
        ) : (
          <ul className="divide-y divide-slate-100 text-sm">
            {students.map((s) => (
              <li key={s.id} className="flex items-center justify-between gap-3 py-2">
                <span className="font-medium text-slate-900">{s.fullName}</span>
                <span className="text-xs text-slate-500">
                  {s.birthYear ? `Năm sinh ${s.birthYear}` : ""}
                  {s.neighborhoodName ? ` · ${s.neighborhoodName}` : ""}
                  {s.relationship ? ` · ${s.relationship}` : ""}
                </span>
              </li>
            ))}
          </ul>
        )}
        <p className="mt-2 text-xs text-slate-400">
          Thông tin học sinh do Bí thư/Quản trị quản lý. Cần chỉnh sửa, vui lòng liên hệ Bí thư phụ trách.
        </p>
      </Card>

      <Card title="Cập nhật thông tin">
        <ProfileForm fullName={me.fullName} phone={me.phone} email={me.email} />
      </Card>
    </>
  );
}
