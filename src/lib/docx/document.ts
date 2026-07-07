/**
 * Sinh tệp `.docx` thật (OOXML WordprocessingML) từ một mô hình tài liệu đơn giản,
 * ZERO dependency. Render SERVER-SIDE (không bao giờ ở client) — guardrail 08C.
 *
 * Một `.docx` là ZIP gồm tối thiểu 3 phần:
 *   [Content_Types].xml · _rels/.rels · word/document.xml
 * Bảng có đường viền khai báo trực tiếp trong `<w:tblBorders>` nên không cần
 * styles.xml — giữ tài liệu tối giản mà vẫn mở tốt trên Word/LibreOffice.
 */
import { zipStore } from "./zip";

/** Khối nội dung của tài liệu. */
export type DocBlock =
  | { type: "heading"; text: string; level?: 1 | 2 }
  | { type: "paragraph"; text: string; italic?: boolean }
  | { type: "spacer" }
  | { type: "table"; header: string[]; rows: string[][] };

/** Loại ký tự điều khiển không hợp lệ trong XML 1.0 (giữ \t=9, \n=10, \r=13). */
function stripControl(value: string): string {
  let out = "";
  for (const ch of value ?? "") {
    const code = ch.codePointAt(0) ?? 0;
    if (code >= 0x20 || code === 0x09 || code === 0x0a || code === 0x0d) out += ch;
  }
  return out;
}

/** Escape ký tự đặc biệt XML sau khi đã loại ký tự điều khiển. */
export function escapeXmlText(value: string): string {
  return stripControl(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Alias nội bộ (giữ tên ngắn cho các builder bên dưới). */
const xml = escapeXmlText;

function runXml(text: string, opts: { bold?: boolean; italic?: boolean; size?: number } = {}): string {
  const rpr: string[] = [];
  if (opts.bold) rpr.push("<w:b/>");
  if (opts.italic) rpr.push("<w:i/>");
  if (opts.size) rpr.push(`<w:sz w:val="${opts.size}"/><w:szCs w:val="${opts.size}"/>`);
  const rprXml = rpr.length ? `<w:rPr>${rpr.join("")}</w:rPr>` : "";
  return `<w:r>${rprXml}<w:t xml:space="preserve">${xml(text)}</w:t></w:r>`;
}

function paragraphXml(text: string, opts: { bold?: boolean; italic?: boolean; size?: number } = {}): string {
  return `<w:p>${runXml(text, opts)}</w:p>`;
}

function headingXml(text: string, level: 1 | 2): string {
  const size = level === 1 ? 32 : 26; // half-points → 16pt / 13pt
  return `<w:p><w:pPr><w:spacing w:before="120" w:after="120"/></w:pPr>${runXml(text, {
    bold: true,
    size,
  })}</w:p>`;
}

function cellXml(text: string, opts: { bold?: boolean } = {}): string {
  return `<w:tc><w:tcPr><w:tcW w:w="0" w:type="auto"/></w:tcPr>${paragraphXml(text, {
    bold: opts.bold,
    size: 20,
  })}</w:tc>`;
}

function tableXml(header: string[], rows: string[][]): string {
  const borders =
    "<w:tblBorders>" +
    ["top", "left", "bottom", "right", "insideH", "insideV"]
      .map((side) => `<w:${side} w:val="single" w:sz="4" w:space="0" w:color="999999"/>`)
      .join("") +
    "</w:tblBorders>";
  const headRow = `<w:tr>${header.map((h) => cellXml(h, { bold: true })).join("")}</w:tr>`;
  const bodyRows = rows
    .map((r) => `<w:tr>${r.map((c) => cellXml(c)).join("")}</w:tr>`)
    .join("");
  return (
    `<w:tbl><w:tblPr><w:tblW w:w="5000" w:type="pct"/>${borders}</w:tblPr>` +
    headRow +
    bodyRows +
    "</w:tbl>"
  );
}

function blockXml(block: DocBlock): string {
  switch (block.type) {
    case "heading":
      return headingXml(block.text, block.level ?? 1);
    case "paragraph":
      return paragraphXml(block.text, { italic: block.italic, size: 22 });
    case "spacer":
      return "<w:p/>";
    case "table":
      return tableXml(block.header, block.rows);
  }
}

function documentXml(blocks: DocBlock[]): string {
  const body = blocks.map(blockXml).join("");
  const sectPr =
    '<w:sectPr><w:pgSz w:w="11906" w:h="16838"/>' +
    '<w:pgMar w:top="1134" w:right="1134" w:bottom="1134" w:left="1134"/></w:sectPr>';
  return (
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
    '<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">' +
    `<w:body>${body}${sectPr}</w:body></w:document>`
  );
}

const CONTENT_TYPES =
  '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
  '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">' +
  '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>' +
  '<Default Extension="xml" ContentType="application/xml"/>' +
  '<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>' +
  "</Types>";

const RELS =
  '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
  '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
  '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>' +
  "</Relationships>";

/** Render danh sách khối thành tệp `.docx` (Buffer). Server-side only. */
export function renderDocx(blocks: DocBlock[]): Buffer {
  const enc = new TextEncoder();
  return zipStore([
    { name: "[Content_Types].xml", data: enc.encode(CONTENT_TYPES) },
    { name: "_rels/.rels", data: enc.encode(RELS) },
    { name: "word/document.xml", data: enc.encode(documentXml(blocks)) },
  ]);
}

/** MIME chuẩn của .docx (WordprocessingML). */
export const DOCX_MIME =
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

/**
 * Chuẩn hóa tên tệp tải về: bỏ ký tự nguy hiểm/điều khiển, giữ chữ-số-gạch,
 * đảm bảo đuôi `.docx`. Tránh header injection ở Content-Disposition.
 */
export function safeDocxFilename(base: string): string {
  const cleaned = base
    .normalize("NFC")
    .replace(/[^\p{L}\p{N}\-_ ]/gu, "")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 80);
  return `${cleaned || "bao-cao"}.docx`;
}
