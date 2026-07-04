/**
 * Schema validation dùng chung (Zod). Spec §7: validation hai tầng
 * (client form + server schema) và chuẩn hóa dữ liệu trước khi ghi DB.
 * Phase 1: chỉ vài primitive tái sử dụng; schema use-case đặt trong module tương ứng.
 */
import { z } from "zod";

/** Số điện thoại VN, chuẩn hóa bỏ khoảng trắng. */
export const phoneSchema = z
  .string()
  .trim()
  .regex(/^(0|\+84)\d{9}$/u, "Số điện thoại không hợp lệ");

export const fullNameSchema = z
  .string()
  .trim()
  .min(2, "Tên quá ngắn")
  .max(100, "Tên quá dài");

export const uuidSchema = z.string().uuid("ID không hợp lệ");

/** Ngày sinh dạng YYYY-MM-DD. */
export const dateOfBirthSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/u, "Ngày sinh phải theo định dạng YYYY-MM-DD");

export { z };
