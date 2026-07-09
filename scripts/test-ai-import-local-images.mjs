/**
 * Dry-run kiểm thử Gemini với ảnh cục bộ trong `src/images/` (09E). SERVER/LOCAL ONLY.
 *
 * KHÔNG insert DB. Xuất báo cáo Markdown vào:
 *   docs/reports/PROMPT-09E-local-images-ai-extraction.md   (GITIGNORED — chứa họ tên = PII)
 *
 * Schema mỗi dòng: full_name, birth_year, gender, confidence, notes.
 * Quy tắc: chỉ điền birth_year/gender NẾU ảnh có thông tin rõ; KHÔNG suy đoán giới tính từ tên.
 *
 * Cần GEMINI_API_KEY (server-only). Thiếu key/ảnh ⇒ báo BLOCKED/NOT VERIFIED, KHÔNG fail build.
 * Cách chạy:  node --env-file=.env.local scripts/test-ai-import-local-images.mjs
 */
import { readFileSync, existsSync, readdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const IMAGES_DIR = "src/images";
const OUT = "docs/reports/PROMPT-09E-local-images-ai-extraction.md";
const apiKey = process.env.GEMINI_API_KEY;
const model = process.env.GEMINI_MODEL ?? "gemini-2.5-flash";
const baseUrl = (process.env.GEMINI_API_BASE_URL ?? "https://generativelanguage.googleapis.com").replace(/\/+$/, "");

function writeReport(body) {
  writeFileSync(OUT, body, "utf8");
  console.log(`[ai-test] Đã ghi báo cáo: ${OUT}`);
}

function mimeFor(name) {
  const n = name.toLowerCase();
  if (n.endsWith(".png")) return "image/png";
  if (n.endsWith(".webp")) return "image/webp";
  return "image/jpeg";
}

const PROMPT = [
  "Bạn là trợ lý trích xuất danh sách học sinh từ ẢNH giấy tờ tiếng Việt.",
  "Trả về DUY NHẤT một JSON: {\"rows\":[{\"full_name\":string,\"birth_year\":number|null,\"gender\":string|null,\"confidence\":number,\"notes\":string}]}.",
  "QUY TẮC BẮT BUỘC:",
  "- full_name: trích xuất đầy đủ họ tên như trong ảnh.",
  "- birth_year: CHỈ điền nếu ảnh ghi rõ năm sinh/ngày sinh; nếu không có → null. TUYỆT ĐỐI không suy đoán.",
  "- gender: CHỈ điền nếu ảnh ghi rõ giới tính; nếu không có → null. KHÔNG suy đoán giới tính từ tên.",
  "- confidence: 0..1 theo độ rõ của dòng.",
  "- notes: ghi chú ngắn (vd 'chữ mờ'), không bịa dữ liệu.",
  "Không thêm chữ nào ngoài JSON.",
].join("\n");

async function extract(buffer, mime) {
  const res = await fetch(`${baseUrl}/v1beta/models/${model}:generateContent`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
    body: JSON.stringify({
      contents: [
        {
          role: "user",
          parts: [
            { text: PROMPT },
            { inline_data: { mime_type: mime, data: buffer.toString("base64") } },
          ],
        },
      ],
      generationConfig: { temperature: 0, responseMimeType: "application/json" },
    }),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const json = await res.json();
  const text = json?.candidates?.[0]?.content?.parts?.map((p) => p.text ?? "").join("") ?? "";
  const parsed = JSON.parse(text);
  return Array.isArray(parsed?.rows) ? parsed.rows : [];
}

function esc(v) {
  return String(v ?? "").replace(/\|/g, "\\|").replace(/\n/g, " ");
}

async function main() {
  const now = new Date().toISOString();
  const header = `# PROMPT 09E — Trích xuất AI ảnh cục bộ (dry-run)\n\n> Sinh tự động lúc ${now}. **KHÔNG commit** (chứa họ tên = PII). Không ghi DB.\n\n`;

  if (!existsSync(IMAGES_DIR)) {
    writeReport(header + "**NOT VERIFIED** — không có thư mục `src/images/`.\n");
    return;
  }
  const files = readdirSync(IMAGES_DIR).filter((f) => /\.(jpe?g|png|webp)$/i.test(f));
  if (files.length === 0) {
    writeReport(header + "**NOT VERIFIED** — không có ảnh nào trong `src/images/`.\n");
    return;
  }
  if (!apiKey) {
    writeReport(header + `**BLOCKED** — thiếu \`GEMINI_API_KEY\`. Có ${files.length} ảnh chờ test.\n`);
    console.log("[ai-test] BLOCKED: thiếu GEMINI_API_KEY (không fail build).");
    return;
  }

  let body = header + `Model: \`${model}\` · ${files.length} ảnh.\n`;
  let totalRows = 0;
  for (const file of files) {
    const buffer = readFileSync(join(IMAGES_DIR, file));
    body += `\n## ${esc(file)}\n\n`;
    try {
      const rows = await extract(buffer, mimeFor(file));
      totalRows += rows.length;
      if (rows.length === 0) {
        body += "_AI không đọc được dòng nào._\n";
        continue;
      }
      body += "| # | Họ tên | Năm sinh | Giới tính | Độ tin cậy | Ghi chú |\n|---|---|---|---|---|---|\n";
      rows.forEach((r, i) => {
        const year = r.birth_year == null || r.birth_year === "" ? "Chưa rõ" : esc(r.birth_year);
        const gender = r.gender == null || r.gender === "" ? "Chưa rõ" : esc(r.gender);
        body += `| ${i + 1} | ${esc(r.full_name)} | ${year} | ${gender} | ${esc(r.confidence)} | ${esc(r.notes)} |\n`;
      });
    } catch (e) {
      body += `_Lỗi khi gọi Gemini: ${esc(e.message)}_\n`;
      console.error(`[ai-test] lỗi một ảnh: ${e.message}`);
    }
  }
  body += `\n---\nTổng: ${totalRows} dòng từ ${files.length} ảnh. birth_year/gender chỉ điền khi ảnh có; không suy đoán.\n`;
  writeReport(body);
  console.log(`[ai-test] Xong: ${files.length} ảnh · ${totalRows} dòng (chi tiết trong báo cáo, KHÔNG in tên ra stdout).`);
}

main().catch((e) => {
  console.error("[ai-test] lỗi:", e.message);
  process.exit(0); // không fail build
});
