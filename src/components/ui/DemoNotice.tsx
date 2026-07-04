/**
 * Nhãn "UI demo / chưa kết nối dữ liệu thật" — hiển thị trên các trang shell
 * để nhấn mạnh dữ liệu là giả và nghiệp vụ chưa nối backend (Prompt 03C).
 */
export function DemoNotice({ className }: { className?: string }) {
  return (
    <div
      className={
        "flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800 " +
        (className ?? "")
      }
    >
      <span aria-hidden className="text-sm">
        ⚠️
      </span>
      <span>
        <strong>UI demo</strong> · Dữ liệu là giả, chưa kết nối cơ sở dữ liệu thật.
      </span>
    </div>
  );
}
