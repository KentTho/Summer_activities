"use client";

/**
 * Hệ thống toast nhẹ (10E) — không phụ thuộc thư viện ngoài.
 * Toast góc phải-trên, tự ẩn, có aria-live để trình đọc màn hình đọc được.
 * CHỈ là lớp trình bày/feedback — KHÔNG chứa logic nghiệp vụ.
 *
 * Dùng: bọc <ToastProvider> quanh cây UI (đã bọc trong DashboardShell), rồi ở
 * client component gọi `const { toast } = useToast(); toast.success("…")`.
 */
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { cn } from "@/lib/utils/cn";

export type ToastTone = "success" | "error" | "info" | "warning";

interface ToastItem {
  id: number;
  tone: ToastTone;
  message: string;
}

interface ToastApi {
  show: (tone: ToastTone, message: string) => void;
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
  warning: (message: string) => void;
}

const ToastContext = createContext<ToastApi | null>(null);

const TONE_STYLE: Record<ToastTone, { box: string; icon: string }> = {
  success: { box: "border-emerald-200 bg-emerald-50 text-emerald-800", icon: "✓" },
  error: { box: "border-rose-200 bg-rose-50 text-rose-800", icon: "!" },
  warning: { box: "border-amber-200 bg-amber-50 text-amber-800", icon: "⚠" },
  info: { box: "border-sky-200 bg-sky-50 text-sky-800", icon: "i" },
};

const AUTO_DISMISS_MS = 3200;
const MAX_VISIBLE_TOASTS = 3;

let nextId = 1;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);

  const remove = useCallback((id: number) => {
    setItems((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const show = useCallback(
    (tone: ToastTone, message: string) => {
      const id = nextId++;
      setItems((prev) => [...prev.slice(-(MAX_VISIBLE_TOASTS - 1)), { id, tone, message }]);
      // Tự ẩn — best-effort, không giữ ref timer vì mỗi toast độc lập.
      setTimeout(() => remove(id), AUTO_DISMISS_MS);
    },
    [remove],
  );

  const api = useMemo<ToastApi>(
    () => ({
      show,
      success: (m) => show("success", m),
      error: (m) => show("error", m),
      info: (m) => show("info", m),
      warning: (m) => show("warning", m),
    }),
    [show],
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div
        aria-live="polite"
        aria-atomic="false"
        className="pointer-events-none fixed right-3 top-3 z-50 flex w-[min(92vw,22rem)] flex-col gap-2"
      >
        {items.map((t) => {
          const style = TONE_STYLE[t.tone];
          return (
            <div
              key={t.id}
              role={t.tone === "error" || t.tone === "warning" ? "alert" : "status"}
              className={cn(
                "pointer-events-auto flex items-start gap-2 rounded-lg border px-3 py-2 text-sm shadow-md",
                style.box,
              )}
            >
              <span aria-hidden className="mt-0.5 select-none font-bold">
                {style.icon}
              </span>
              <span className="min-w-0 flex-1">{t.message}</span>
              <button
                type="button"
                aria-label="Đóng thông báo"
                onClick={() => remove(t.id)}
                className="-mr-1 shrink-0 rounded px-1 text-lg leading-none opacity-60 hover:opacity-100"
              >
                ×
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

/**
 * Truy cập API toast. Nếu chưa bọc trong ToastProvider, trả về no-op để không
 * làm vỡ component tái dùng ở nơi chưa có provider (an toàn khi render server-first).
 */
export function useToast(): ToastApi {
  const ctx = useContext(ToastContext);
  if (ctx) return ctx;
  const noop = () => {};
  return { show: noop, success: noop, error: noop, info: noop, warning: noop };
}
