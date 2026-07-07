"use client";

import { useActionState } from "react";
import { Button, Card } from "@/components/ui";
import { saveSettings, type SettingsActionState } from "./actions";
import type { SystemSettingsView } from "@/lib/data/admin";

const field =
  "h-11 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100";

export function SettingsForm({ settings }: { settings: SystemSettingsView }) {
  const [state, formAction, pending] = useActionState<SettingsActionState, FormData>(
    saveSettings,
    {},
  );

  return (
    <Card>
      <form action={formAction} className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            Tên hệ thống <span className="text-red-500">*</span>
          </label>
          <input name="system_name" required defaultValue={settings.systemName} className={field} />
          <p className="mt-1 text-xs text-slate-400">Hiển thị trên tiêu đề &amp; báo cáo.</p>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Màu chủ đạo</label>
          <input
            name="primary_color"
            defaultValue={settings.primaryColor}
            placeholder="#4f46e5"
            className={field}
          />
          <p className="mt-1 text-xs text-slate-400">Mã màu hex hợp lệ (vd #4f46e5). Để trống nếu không dùng.</p>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Chân trang</label>
          <input
            name="public_footer_text"
            defaultValue={settings.publicFooterText}
            placeholder="Văn bản chân trang"
            className={field}
          />
          <p className="mt-1 text-xs text-slate-400">Văn bản thuần — không nhận HTML/CSS/JS.</p>
        </div>
        <div className="flex items-center justify-end gap-3">
          {state.error ? (
            <span role="alert" className="text-sm text-red-600">
              {state.error}
            </span>
          ) : state.ok ? (
            <span className="text-sm text-green-600">Đã lưu cấu hình.</span>
          ) : null}
          <Button type="submit" disabled={pending} className="h-9 px-4 text-sm">
            {pending ? "Đang lưu…" : "Lưu cấu hình"}
          </Button>
        </div>
      </form>
    </Card>
  );
}
