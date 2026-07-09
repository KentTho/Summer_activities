"use client";

import { useActionState } from "react";
import type { AccountActionState } from "../account-actions";
import { resolvePasswordRequest } from "./actions";

/** Nút "Cấp mật khẩu tạm" cho một yêu cầu; hiển thị mật khẩu MỘT LẦN. */
export function ResolveRequestButton({ requestId }: { requestId: string }) {
  const [state, formAction, pending] = useActionState<AccountActionState, FormData>(
    resolvePasswordRequest,
    {},
  );

  return (
    <span className="inline-flex flex-wrap items-center gap-2">
      <form action={formAction}>
        <input type="hidden" name="request_id" value={requestId} />
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-indigo-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
        >
          {pending ? "Đang cấp…" : "Cấp mật khẩu tạm"}
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
