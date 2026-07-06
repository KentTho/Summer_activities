"use client";

import { useActionState } from "react";
import { resetPassword, type AccountActionState } from "./account-actions";

/** Nút reset mật khẩu tạm; hiển thị mật khẩu MỘT LẦN (Admin copy ngay, không lưu). */
export function ResetPasswordButton({ profileId }: { profileId: string }) {
  const [state, formAction, pending] = useActionState<AccountActionState, FormData>(
    resetPassword,
    {},
  );

  return (
    <span className="inline-flex flex-wrap items-center gap-2">
      <form action={formAction}>
        <input type="hidden" name="profile_id" value={profileId} />
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-200 disabled:opacity-50"
        >
          {pending ? "Đang reset…" : "Reset mật khẩu"}
        </button>
      </form>
      {state.tempPassword ? (
        <span className="rounded bg-amber-50 px-2 py-0.5 font-mono text-xs text-amber-800">
          Mật khẩu tạm: <b>{state.tempPassword}</b> — copy ngay, sẽ không hiện lại
        </span>
      ) : state.error ? (
        <span className="text-xs text-red-600">{state.error}</span>
      ) : null}
    </span>
  );
}
