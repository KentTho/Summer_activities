"use client";

import { useActionState } from "react";
import { Button, Card } from "@/components/ui";
import { ocrExtractRows, type ImportActionState } from "../actions";

/**
 * Tải ảnh/PDF giấy tờ → chạy OCR **trên server** → tạo dòng nháp CHƯA DUYỆT.
 * Không tạo học sinh ở đây. API key OCR không bao giờ ở client.
 */
export function OcrUploadForm({
  batchId,
  configured,
}: {
  batchId: string;
  configured: boolean;
}) {
  const [state, formAction, pending] = useActionState<ImportActionState, FormData>(
    ocrExtractRows,
    {},
  );

  return (
    <Card title="Nhận dạng từ ảnh (OCR)" className="mb-4">
      <form action={formAction} className="grid gap-3">
        {!configured ? (
          <p className="rounded-md bg-amber-50 px-3 py-2 text-xs text-amber-800">
            OCR chưa cấu hình (thiếu <code>OCR_SPACE_API_KEY</code> — server-only). Bạn vẫn
            có thể nhập tay bên dưới; thêm key vào <code>.env.local</code> để bật OCR.
          </p>
        ) : null}
        <input type="hidden" name="batch_id" value={batchId} />
        <input
          type="file"
          name="file"
          accept="image/jpeg,image/png,image/webp,application/pdf"
          required
          className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-slate-100 file:px-3 file:py-2 file:text-sm"
        />
        <p className="text-xs text-slate-400">
          Ảnh/PDF ≤ 1MB. OCR chạy trên server; kết quả là dòng nháp{" "}
          <span className="font-medium text-amber-700">chưa duyệt</span> — hãy kiểm tra &amp;
          sửa trước khi tạo học sinh.
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <Button type="submit" disabled={pending || !configured}>
            {pending ? "Đang nhận dạng…" : "Tải ảnh & nhận dạng"}
          </Button>
          {state.error ? (
            <span role="alert" className="text-sm text-red-600">
              {state.error}
            </span>
          ) : null}
          {state.ok ? (
            <span className="text-sm text-green-600">
              Đã tạo {state.count} dòng nháp từ OCR — kiểm tra &amp; sửa bên dưới.
            </span>
          ) : null}
        </div>
      </form>
    </Card>
  );
}
