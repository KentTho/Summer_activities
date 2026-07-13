"use client";

/**
 * Nhóm nút chọn trạng thái điểm danh cho MỘT học sinh (10E).
 * Thuần trình bày: nhận trạng thái hiện tại + callback, không tự gọi server.
 */
import { MARK_OPTIONS, NOT_MARKED, type MarkValue } from "@/modules/attendance/domain/attendance-status";
import { cn } from "@/lib/utils/cn";

/** Màu nhấn theo trạng thái khi đang được chọn. */
const ACTIVE_STYLE: Record<MarkValue, string> = {
  PRESENT: "bg-emerald-600 text-white",
  EXCUSED: "bg-amber-500 text-white",
  UNEXCUSED: "bg-rose-600 text-white",
  [NOT_MARKED]: "bg-slate-600 text-white",
};

export function AttendanceStatusButtons({
  current,
  pending,
  onSelect,
}: {
  /** Trạng thái hiện tại (null = chưa điểm danh). */
  current: MarkValue;
  /** Đang gửi request cho học sinh này → khóa để tránh double submit/race. */
  pending: boolean;
  onSelect: (value: MarkValue) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {MARK_OPTIONS.map((opt) => {
        const active = opt.value === current;
        return (
          <button
            key={opt.value}
            type="button"
            aria-pressed={active}
            disabled={pending}
            onClick={() => onSelect(opt.value)}
            className={cn(
              "h-8 rounded-md px-2.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300 disabled:cursor-not-allowed disabled:opacity-50",
              active ? ACTIVE_STYLE[opt.value] : "bg-slate-100 text-slate-700 hover:bg-slate-200",
            )}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
