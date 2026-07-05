/**
 * Kiểu dùng chung toàn app.
 * `Database` sinh từ Supabase CLI (`supabase gen types typescript --linked`) và
 * lưu ở `src/lib/database.types.ts`. Re-export ở đây để phần còn lại của app import
 * một chỗ ổn định (`@/lib/types`).
 */
export type { Database, Json } from "@/lib/database.types";

/** Tiện ích lấy Row/Insert/Update của một bảng theo tên. */
import type { Database } from "@/lib/database.types";

export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];
export type TablesInsert<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Insert"];
export type TablesUpdate<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Update"];
export type Enums<T extends keyof Database["public"]["Enums"]> =
  Database["public"]["Enums"][T];

export type Nullable<T> = T | null;

export interface Paginated<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
}
