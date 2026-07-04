import { Card } from "./Card";

/** Thẻ KPI: nhãn + số liệu + gợi ý phụ. Dùng ở các dashboard. */
export function StatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string | number;
  hint?: string;
}) {
  return (
    <Card title={label}>
      <p className="text-2xl font-semibold text-slate-900">{value}</p>
      {hint ? <p className="mt-1 text-xs text-slate-400">{hint}</p> : null}
    </Card>
  );
}
