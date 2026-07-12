import { cn } from "@/lib/utils/cn";

interface SkeletonBlockProps {
  className?: string;
  /** Số dòng giả (mặc định 1). Dùng nhanh cho placeholder danh sách. */
  lines?: number;
}

/**
 * Khối "đang tải" (skeleton) chuẩn hóa (10D) — dùng trong loading.tsx / Suspense fallback.
 * Thuần trình bày, không chứa dữ liệu nghiệp vụ.
 */
export function SkeletonBlock({ className, lines = 1 }: SkeletonBlockProps) {
  if (lines <= 1) {
    return (
      <div
        aria-hidden
        className={cn("h-4 animate-pulse rounded bg-slate-200", className)}
      />
    );
  }
  return (
    <div className="space-y-2" aria-hidden>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className={cn(
            "h-4 animate-pulse rounded bg-slate-200",
            i === lines - 1 && "w-2/3",
            className,
          )}
        />
      ))}
    </div>
  );
}
