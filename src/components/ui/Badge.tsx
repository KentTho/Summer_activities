import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

export type BadgeTone =
  | "slate"
  | "green"
  | "amber"
  | "red"
  | "indigo"
  | "blue";

const TONES: Record<BadgeTone, string> = {
  slate: "bg-slate-100 text-slate-600",
  green: "bg-emerald-100 text-emerald-700",
  amber: "bg-amber-100 text-amber-700",
  red: "bg-rose-100 text-rose-700",
  indigo: "bg-indigo-100 text-indigo-700",
  blue: "bg-sky-100 text-sky-700",
};

/** Nhãn trạng thái nhỏ gọn (điểm danh, đơn nghỉ, loại buổi…). */
export function Badge({
  tone = "slate",
  children,
}: {
  tone?: BadgeTone;
  children: ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        TONES[tone],
      )}
    >
      {children}
    </span>
  );
}
