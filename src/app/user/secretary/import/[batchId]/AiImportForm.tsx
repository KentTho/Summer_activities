"use client";

import { useActionState } from "react";
import { Button, Card } from "@/components/ui";
import { aiExtractRows, type ImportActionState } from "../actions";

/**
 * Tải ẢNH giấy tờ → AI (Gemini) đọc **trên server** → tạo dòng nháp CHƯA DUYỆT.
 * KHÔNG tạo học sinh ở đây. API key AI không bao giờ ở client.
 */
export function AiImportForm({
  batchId,
  ready,
  remaining,
  limit,
}: {
  batchId: string;
  ready: boolean;
  remaining: number;
  limit: number;
}) {
  const [state, formAction, pending] = useActionState<ImportActionState, FormData>(
    aiExtractRows,
    {},
  );
  const outOfQuota = remaining <= 0;

  return (
    <Card title="AI đọc ảnh (Gemini)" className="mb-4">
      <form action={formAction} className="grid gap-3">
        {!ready ? (
          <p className="rounded-md bg-amber-50 px-3 py-2 text-xs text-amber-800">
            Tính năng AI đọc ảnh chưa sẵn sàng (chưa cấu hình hoặc đã tắt). Bạn vẫn có thể
            nhập tay bên dưới.
          </p>
        ) : null}
        {ready ? (
          <p className={`text-xs ${outOfQuota ? "text-red-600" : "text-slate-500"}`}>
            Lượt AI hôm nay: còn <span className="font-medium">{remaining}</span>/{limit}.
            {outOfQuota
              ? " Đã đạt giới hạn — hãy nhập tay bên dưới hoặc thử lại ngày mai."
              : ""}
          </p>
        ) : null}
        <p className="rounded-md bg-amber-50 px-3 py-2 text-xs text-amber-800">
          ⚠️ AI có thể đọc sai. Vui lòng kiểm tra kỹ từng dòng trước khi xác nhận tạo học sinh.
          Ảnh được lưu riêng tư để đối chiếu khi cần.
        </p>
        <input type="hidden" name="batch_id" value={batchId} />
        <input
          type="file"
          name="file"
          accept="image/jpeg,image/png,image/webp"
          required
          className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-slate-100 file:px-3 file:py-2 file:text-sm"
        />
        <p className="text-xs text-slate-400">
          Ảnh JPG/PNG/WebP ≤ 4MB (chưa hỗ trợ PDF). AI chạy trên máy chủ; kết quả là dòng nháp{" "}
          <span className="font-medium text-amber-700">chưa duyệt</span> — hãy kiểm tra &amp; sửa
          trước khi tạo học sinh.
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <Button type="submit" disabled={pending || !ready || outOfQuota}>
            {pending ? "AI đang đọc…" : "Tải ảnh & để AI đọc"}
          </Button>
          {state.error ? (
            <span role="alert" className="text-sm text-red-600">
              {state.error}
            </span>
          ) : null}
          {state.ok ? (
            <span className="text-sm text-green-600">
              AI tạo {state.count} dòng nháp — kiểm tra &amp; sửa bên dưới.
            </span>
          ) : null}
        </div>
        {state.warnings && state.warnings.length > 0 ? (
          <ul className="list-disc pl-5 text-xs text-amber-700">
            {state.warnings.map((w, i) => (
              <li key={i}>{w}</li>
            ))}
          </ul>
        ) : null}
      </form>
    </Card>
  );
}
