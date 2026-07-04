import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

interface CardProps {
  title?: string;
  children: ReactNode;
  className?: string;
}

export function Card({ title, children, className }: CardProps) {
  return (
    <section
      className={cn(
        "rounded-xl border border-slate-200 bg-white p-4 shadow-sm",
        className,
      )}
    >
      {title ? (
        <h3 className="mb-2 text-sm font-semibold text-slate-500">{title}</h3>
      ) : null}
      {children}
    </section>
  );
}
