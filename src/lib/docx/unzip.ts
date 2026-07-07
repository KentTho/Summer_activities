/**
 * Bộ ĐỌC ZIP tối giản (server-only) — dùng để đọc mẫu `.docx` upload.
 * Hỗ trợ 2 phương thức phổ biến trong docx: STORE (0) và DEFLATE (8, qua `zlib`).
 * Không cài thư viện ngoài (dùng `node:zlib` sẵn có). Bổ trợ cho `zip.ts` (bộ ghi).
 */
import { inflateRawSync } from "node:zlib";

export interface UnzipEntry {
  name: string;
  data: Buffer;
}

/** Tìm offset của End Of Central Directory (quét ngược từ cuối buffer). */
function findEocd(buf: Buffer): number {
  // EOCD tối thiểu 22 byte; comment tối đa 65535 → quét vùng cuối là đủ.
  const minEnd = Math.max(0, buf.length - 22 - 0xffff);
  for (let i = buf.length - 22; i >= minEnd; i--) {
    if (buf.readUInt32LE(i) === 0x06054b50) return i;
  }
  return -1;
}

/**
 * Giải nén toàn bộ entry trong ZIP thành { name, data(giải nén) }.
 * Ném lỗi rõ ràng nếu tệp không phải ZIP hợp lệ.
 */
export function unzip(buf: Buffer): UnzipEntry[] {
  const eocd = findEocd(buf);
  if (eocd < 0) throw new Error("Tệp không phải ZIP hợp lệ (thiếu EOCD).");

  const entryCount = buf.readUInt16LE(eocd + 10);
  let ptr = buf.readUInt32LE(eocd + 16); // offset central directory

  const entries: UnzipEntry[] = [];
  for (let i = 0; i < entryCount; i++) {
    if (buf.readUInt32LE(ptr) !== 0x02014b50) {
      throw new Error("Central directory hỏng.");
    }
    const method = buf.readUInt16LE(ptr + 10);
    const compSize = buf.readUInt32LE(ptr + 20);
    const nameLen = buf.readUInt16LE(ptr + 28);
    const extraLen = buf.readUInt16LE(ptr + 30);
    const commentLen = buf.readUInt16LE(ptr + 32);
    const localOffset = buf.readUInt32LE(ptr + 42);
    // ZIP chuẩn dùng "/"; một số công cụ Windows ghi "\" — chuẩn hóa cho chắc.
    const name = buf.toString("utf8", ptr + 46, ptr + 46 + nameLen).replace(/\\/g, "/");

    // Đọc local header để tính đúng vị trí dữ liệu (extra len local có thể khác).
    if (buf.readUInt32LE(localOffset) !== 0x04034b50) {
      throw new Error("Local file header hỏng.");
    }
    const localNameLen = buf.readUInt16LE(localOffset + 26);
    const localExtraLen = buf.readUInt16LE(localOffset + 28);
    const dataStart = localOffset + 30 + localNameLen + localExtraLen;
    const raw = buf.subarray(dataStart, dataStart + compSize);

    let data: Buffer;
    if (method === 0) data = Buffer.from(raw);
    else if (method === 8) data = inflateRawSync(raw);
    else throw new Error(`Phương thức nén không hỗ trợ (${method}).`);

    entries.push({ name, data });
    ptr += 46 + nameLen + extraLen + commentLen;
  }
  return entries;
}
