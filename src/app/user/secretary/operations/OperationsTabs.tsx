"use client";

/**
 * Tabs cho trang Vận hành (10F): Đơn xin nghỉ | Thông báo phụ huynh.
 * Nhận sẵn 2 panel (đã render ở server/client con) và chuyển tab client-side.
 */
import { useState, type ReactNode } from "react";

export function OperationsTabs({
  initialTab,
  pendingLeaveCount,
  leavePanel,
  notificationsPanel,
}: {
  initialTab: "leave" | "notifications";
  pendingLeaveCount: number;
  leavePanel: ReactNode;
  notificationsPanel: ReactNode;
}) {
  const [tab, setTab] = useState<"leave" | "notifications">(initialTab);

  return (
    <div>
      <div className="mb-4 flex gap-1 border-b border-slate-200">
        <TabButton active={tab === "leave"} onClick={() => setTab("leave")}>
          Đơn xin nghỉ
          {pendingLeaveCount > 0 ? (
            <span className="ml-1.5 inline-flex min-w-5 items-center justify-center rounded-full bg-indigo-600 px-1.5 text-xs font-semibold text-white">
              {pendingLeaveCount}
            </span>
          ) : null}
        </TabButton>
        <TabButton active={tab === "notifications"} onClick={() => setTab("notifications")}>
          Thông báo phụ huynh
        </TabButton>
      </div>

      <div className={tab === "leave" ? "" : "hidden"}>{leavePanel}</div>
      <div className={tab === "notifications" ? "" : "hidden"}>{notificationsPanel}</div>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      className={
        "-mb-px inline-flex items-center border-b-2 px-4 py-2 text-sm font-medium transition-colors " +
        (active
          ? "border-indigo-600 text-indigo-700"
          : "border-transparent text-slate-500 hover:text-slate-800")
      }
    >
      {children}
    </button>
  );
}
