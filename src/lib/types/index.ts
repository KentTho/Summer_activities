/**
 * Kiểu dùng chung toàn app.
 * `Database` là placeholder cho type sinh từ Supabase CLI
 * (`supabase gen types typescript`) ở Phase 2. Hiện để rỗng để scaffold build được.
 */

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface Database {}

export type Nullable<T> = T | null;

export interface Paginated<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
}
