import type { ReactNode } from "react";

interface PageHeaderProps {
  title: string;
  description?: string;
  /** Nhãn nhỏ phía trên tiêu đề (vd: khu vực/nhóm chức năng). */
  eyebrow?: string;
  /** Nút/hành động ở góc phải (vd: "Xuất DOCX", "Thêm mới"). */
  actions?: ReactNode;
}

/**
 * Tiêu đề trang chuẩn hóa (10D): eyebrow + tiêu đề + mô tả, kèm khu hành động
 * ở góc phải. Tự xuống dòng gọn trên mobile (actions rớt xuống dưới).
 */
export function PageHeader({
  title,
  description,
  eyebrow,
  actions,
}: PageHeaderProps) {
  return (
    <header className="mb-6 flex flex-wrap items-start justify-between gap-3">
      <div className="min-w-0">
        {eyebrow ? (
          <p className="mb-1 text-xs font-medium uppercase tracking-wide text-indigo-600">
            {eyebrow}
          </p>
        ) : null}
        <h1 className="text-xl font-semibold tracking-tight text-slate-900 md:text-2xl">
          {title}
        </h1>
        {description ? (
          <p className="mt-1 text-sm text-slate-500">{description}</p>
        ) : null}
      </div>
      {actions ? (
        <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>
      ) : null}
    </header>
  );
}
