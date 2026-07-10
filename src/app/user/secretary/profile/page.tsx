import { Badge, Card } from "@/components/ui";
import { PageHeader } from "@/components/layout";
import { getMyNeighborhoodAssignments, getMyProfileDetails } from "@/lib/data/profile";
import { ProfileForm } from "@/components/profile/ProfileForm";

export const dynamic = "force-dynamic";

const ASSIGN_LABEL: Record<string, string> = {
  PRIMARY: "Phụ trách chính",
  COORDINATING: "Phụ trách chung",
};

export default async function SecretaryProfilePage() {
  const [me, assignments] = await Promise.all([
    getMyProfileDetails(),
    getMyNeighborhoodAssignments(),
  ]);
  if (!me) return null;

  return (
    <>
      <PageHeader title="Thông tin cá nhân" description="Thông tin tài khoản và Khu phố phụ trách." />

      <Card title="Vai trò & phụ trách" className="mb-4">
        <p className="mb-2 text-sm text-slate-700">
          {me.staffTitle ?? "Bí thư / Chi Đoàn"} (SECRETARY)
        </p>
        {assignments.length === 0 ? (
          <p className="text-sm text-amber-700">
            Chưa được phân công Khu phố. Vui lòng liên hệ Quản trị để được gán.
          </p>
        ) : (
          <ul className="flex flex-wrap gap-2">
            {assignments.map((a) => (
              <li key={a.neighborhoodCode}>
                <Badge tone="indigo">
                  {a.neighborhoodCode} · {a.neighborhoodName} · {ASSIGN_LABEL[a.assignmentRole] ?? a.assignmentRole}
                </Badge>
              </li>
            ))}
          </ul>
        )}
        <p className="mt-2 text-xs text-slate-400">
          Vai trò và phân công Khu phố do Quản trị quản lý — bạn không tự thay đổi được.
        </p>
      </Card>

      <Card title="Cập nhật thông tin">
        <ProfileForm fullName={me.fullName} phone={me.phone} email={me.email} />
      </Card>
    </>
  );
}
