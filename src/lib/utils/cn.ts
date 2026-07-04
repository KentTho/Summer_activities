/**
 * Nối className có điều kiện (không kéo thêm dependency ở Phase 1).
 */
export type ClassValue = string | number | null | false | undefined;

export function cn(...values: ClassValue[]): string {
  return values.filter(Boolean).join(" ");
}
