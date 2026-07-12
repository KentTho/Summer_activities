import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

/**
 * Lớp input/select/textarea dùng chung toàn dự án (10D).
 * Gom về một chỗ để mọi form có cùng chiều cao, bo góc, viền và focus ring.
 * Import class này thay vì lặp lại chuỗi Tailwind ở từng trang.
 */
export const fieldClass =
  "h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400";

interface FormFieldProps {
  label: string;
  htmlFor?: string;
  /** Gợi ý phụ dưới nhãn (mô tả cách nhập). */
  hint?: string;
  /** Thông báo lỗi cho trường này (hiện màu đỏ, thay cho hint). */
  error?: string;
  /** Đánh dấu bắt buộc (thêm dấu * đỏ). */
  required?: boolean;
  children: ReactNode;
  className?: string;
}

/**
 * Bọc một trường form: nhãn + gợi ý/lỗi + control (children).
 * Không tự render input để giữ nguyên mọi thuộc tính/hành vi của control gốc.
 */
export function FormField({
  label,
  htmlFor,
  hint,
  error,
  required,
  children,
  className,
}: FormFieldProps) {
  return (
    <div className={cn("space-y-1", className)}>
      <label
        htmlFor={htmlFor}
        className="block text-sm font-medium text-slate-700"
      >
        {label}
        {required ? <span className="ml-0.5 text-rose-500">*</span> : null}
      </label>
      {children}
      {error ? (
        <p className="text-xs text-rose-600">{error}</p>
      ) : hint ? (
        <p className="text-xs text-slate-400">{hint}</p>
      ) : null}
    </div>
  );
}
