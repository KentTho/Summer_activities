/**
 * Adapter OCR.space Free OCR API (server-only).
 * API key đọc từ env (server) — KHÔNG BAO GIỜ đưa ra client.
 * Tài liệu: https://ocr.space/ocrapi
 */
import { env } from "@/lib/env";
import type { OcrInput, OcrProvider, OcrResult } from "./types";

interface OcrSpaceParsedResult {
  ParsedText?: string;
  ErrorMessage?: string | string[];
}
interface OcrSpaceResponse {
  ParsedResults?: OcrSpaceParsedResult[];
  OCRExitCode?: number;
  IsErroredOnProcessing?: boolean;
  ErrorMessage?: string | string[];
  ErrorDetails?: string;
  // OCR.space cũng có thể trả lỗi ở dạng {error, details} khi HTTP 4xx.
  error?: string;
  details?: string;
}

function joinError(msg: string | string[] | undefined): string {
  if (!msg) return "";
  return Array.isArray(msg) ? msg.join("; ") : msg;
}

export function createOcrSpaceProvider(): OcrProvider {
  return {
    name: "ocrspace",
    async recognize(input: OcrInput): Promise<OcrResult> {
      if (!env.ocrSpaceApiKey) {
        throw new Error("OCR chưa cấu hình (thiếu OCR_SPACE_API_KEY).");
      }

      const form = new FormData();
      form.set("base64Image", `data:${input.mimeType};base64,${input.base64}`);
      form.set("language", env.ocrSpaceLanguage);
      form.set("OCREngine", env.ocrSpaceEngine);
      form.set("isOverlayRequired", "false");
      form.set("scale", "true");
      form.set("detectOrientation", "true");
      if (input.mimeType === "application/pdf") form.set("filetype", "PDF");

      let res: Response;
      try {
        res = await fetch(env.ocrSpaceApiUrl, {
          method: "POST",
          headers: { apikey: env.ocrSpaceApiKey },
          body: form,
          // Không cache; đây là lời gọi phụ thuộc dữ liệu người dùng.
          cache: "no-store",
        });
      } catch (e) {
        throw new Error("Không gọi được dịch vụ OCR. " + (e as Error).message);
      }

      // Đọc body một lần; OCR.space trả JSON cả khi 4xx (dạng {error, details}).
      let json: OcrSpaceResponse | null = null;
      try {
        json = (await res.json()) as OcrSpaceResponse;
      } catch {
        json = null;
      }

      if (!res.ok) {
        const detail =
          json?.error ||
          json?.details ||
          joinError(json?.ErrorMessage) ||
          `HTTP ${res.status}`;
        throw new Error("OCR lỗi: " + detail);
      }
      if (!json) throw new Error("OCR trả về dữ liệu không hợp lệ.");

      if (json.IsErroredOnProcessing || json.OCRExitCode !== 1) {
        const detail =
          joinError(json.ErrorMessage) ||
          json.ErrorDetails ||
          joinError(json.ParsedResults?.[0]?.ErrorMessage) ||
          "OCR không đọc được nội dung.";
        throw new Error("OCR lỗi: " + detail);
      }

      const text = (json.ParsedResults ?? [])
        .map((r) => r.ParsedText ?? "")
        .join("\n")
        .trim();

      return { text, provider: "ocrspace" };
    },
  };
}
