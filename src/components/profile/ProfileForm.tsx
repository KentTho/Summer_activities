"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui";
import { updateOwnProfile, type ProfileActionState } from "@/lib/data/profile-actions";

const cls =
  "h-10 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100";

/**
 * Form tự cập nhật thông tin cá nhân (họ tên + SĐT). Email chỉ hiển thị (Admin quản lý).
 * Không cho đổi vai trò/phân công. Đổi mật khẩu qua liên kết /change-password.
 */
export function ProfileForm({
  fullName,
  phone,
  email,
}: {
  fullName: string;
  phone: string | null;
  email: string | null;
}) {
  const [state, formAction, pending] = useActionState<ProfileActionState, FormData>(
    updateOwnProfile,
    {},
  );

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <label htmlFor="full_name" className="mb-1 block text-sm font-medium text-slate-700">
          Họ tên hiển thị
        </label>
        <input id="full_name" name="full_name" required defaultValue={fullName} className={cls} />
      </div>
      <div>
        <label htmlFor="phone" className="mb-1 block text-sm font-medium text-slate-700">
          Số điện thoại
        </label>
        <input
          id="phone"
          name="phone"
          inputMode="tel"
          defaultValue={phone ?? ""}
          placeholder="Chưa có"
          className={cls}
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Email (liên hệ)</label>
        <input value={email ?? "—"} disabled className={`${cls} bg-slate-50 text-slate-500`} />
        <p className="mt-1 text-xs text-slate-400">
          Email do Quản trị quản lý. Cần đổi email đăng nhập, vui lòng liên hệ Quản trị.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" disabled={pending}>
          {pending ? "Đang lưu…" : "Lưu thay đổi"}
        </Button>
        <Link href="/change-password" className="text-sm text-indigo-600 hover:underline">
          Đổi mật khẩu
        </Link>
        {state.error ? (
          <span role="alert" className="text-sm text-red-600">
            {state.error}
          </span>
        ) : null}
        {state.ok ? <span className="text-sm text-green-600">Đã cập nhật.</span> : null}
      </div>
    </form>
  );
}
