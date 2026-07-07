/**
 * Gọi Gemini Vision (generativelanguage REST) bằng `fetch` — SERVER-ONLY.
 * API key chỉ đọc từ env, KHÔNG bao giờ ra client, KHÔNG log key/ảnh/base64.
 * Trả về JSON thô đã parse (chưa chuẩn hóa) để `index.ts` validate bằng Zod.
 */
import "server-only";

import { env } from "@/lib/env";
import type { AiImportInput } from "./types";

const PROMPT = [
  "Bạn là trợ lý nhập liệu. Ảnh là danh sách/giấy tờ học sinh (tiếng Việt).",
  "Trích xuất TỪNG học sinh. CHỈ trả về JSON hợp lệ đúng schema sau, KHÔNG kèm giải thích, KHÔNG markdown:",
  '{ "rows": [ { "full_name": "string", "birth_date": "YYYY-MM-DD hoặc null", "guardian_phone": "string", "confidence": 0.0, "notes": "string" } ], "warnings": ["string"] }',
  "Quy tắc: full_name là họ tên học sinh; birth_date để null nếu không rõ; guardian_phone là SĐT phụ huynh nếu có (giữ nguyên chữ số).",
  "confidence 0..1 theo độ chắc chắn của bạn. Nếu ảnh mờ/không đọc được, trả rows rỗng và thêm cảnh báo vào warnings.",
].join("\n");

interface GeminiRawResponse {
  candidates?: { content?: { parts?: { text?: string }[] } }[];
  promptFeedback?: { blockReason?: string };
  error?: { message?: string; status?: string };
}

/** Bỏ code fence ```json ... ``` nếu model lỡ bọc (an toàn dù đã yêu cầu JSON thuần). */
function stripCodeFence(text: string): string {
  const t = text.trim();
  const fence = t.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  return (fence ? fence[1] : t).trim();
}

/**
 * Gọi Gemini và trả về chuỗi JSON thô (chưa validate). Ném lỗi thân thiện khi
 * thiếu key, timeout, quota, hoặc bị chặn nội dung.
 */
export async function callGeminiJson(input: AiImportInput): Promise<string> {
  if (!env.geminiApiKey) throw new Error("Chưa cấu hình Gemini (thiếu GEMINI_API_KEY).");

  const url = `${env.geminiApiBaseUrl}/v1beta/models/${env.geminiModel}:generateContent`;
  const body = {
    contents: [
      {
        parts: [
          { text: PROMPT },
          { inline_data: { mime_type: input.mimeType, data: input.base64 } },
        ],
      },
    ],
    generationConfig: { temperature: 0, responseMimeType: "application/json" },
  };

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30_000);
  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": env.geminiApiKey },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
  } catch (err) {
    throw new Error(
      (err as Error).name === "AbortError"
        ? "AI đọc ảnh quá thời gian chờ. Hãy thử lại hoặc nhập tay."
        : "Không kết nối được dịch vụ AI. Hãy thử lại hoặc nhập tay.",
    );
  } finally {
    clearTimeout(timeout);
  }

  const json = (await res.json().catch(() => null)) as GeminiRawResponse | null;

  if (!res.ok) {
    // 429 = quota. Không lộ chi tiết nhạy cảm.
    if (res.status === 429) throw new Error("AI đang quá tải/hết hạn mức. Hãy thử lại sau hoặc nhập tay.");
    throw new Error("Dịch vụ AI trả lỗi. Hãy thử lại hoặc nhập tay.");
  }
  if (!json || json.error) throw new Error("Dịch vụ AI trả lỗi. Hãy thử lại hoặc nhập tay.");
  if (json.promptFeedback?.blockReason) throw new Error("Ảnh bị dịch vụ AI từ chối xử lý. Hãy dùng ảnh khác.");

  const text = json.candidates?.[0]?.content?.parts?.map((p) => p.text ?? "").join("") ?? "";
  if (!text.trim()) throw new Error("AI không trả về dữ liệu. Hãy thử ảnh rõ hơn hoặc nhập tay.");
  return stripCodeFence(text);
}
