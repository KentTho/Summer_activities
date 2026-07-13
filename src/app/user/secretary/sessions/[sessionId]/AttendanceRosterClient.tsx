"use client";

/**
 * Roster điểm danh optimistic (10E/10F).
 * - Nhận roster ban đầu từ server (đã qua RLS). Không truy vấn DB ở client.
 * - Click trạng thái: cập nhật local ngay, khóa đúng hàng đang gửi, gọi server
 *   action; thành công → toast, thất bại → rollback + toast lỗi.
 * - Bộ đếm cập nhật optimistic theo local state (theo Khu phố đang chọn).
 * - Tìm kiếm client-side (debounce bằng useDeferredValue) — không reload trang.
 * - 10F: buổi chung nhiều Khu phố → selector chọn Khu phố để xem/điểm danh + tổng.
 */
import { useCallback, useDeferredValue, useMemo, useRef, useState } from "react";
import { Badge, useToast } from "@/components/ui";
import {
  ATTENDANCE_STATUS_LABEL,
  ATTENDANCE_TONE,
  NOT_MARKED,
  type AttendanceStatus,
  type MarkValue,
} from "@/modules/attendance/domain/attendance-status";
import { markAttendanceAction } from "../../attendance/actions";
import { AttendanceStatusButtons } from "./AttendanceStatusButtons";

export interface RosterClientEntry {
  studentId: string;
  fullName: string;
  neighborhoodId: string;
  guardianPhone: string | null;
  status: AttendanceStatus | null;
}

export interface NeighborhoodOption {
  id: string;
  name: string;
}

const ALL = "ALL";

function markValueToStatus(value: MarkValue): AttendanceStatus | null {
  return value === NOT_MARKED ? null : value;
}

export function AttendanceRosterClient({
  sessionId,
  initialRoster,
  neighborhoods,
  locked,
}: {
  sessionId: string;
  initialRoster: RosterClientEntry[];
  /** Khu phố của buổi (>1 = buổi chung → hiện selector). */
  neighborhoods: NeighborhoodOption[];
  locked: boolean;
}) {
  const { success, error } = useToast();

  const [statuses, setStatuses] = useState<Record<string, AttendanceStatus | null>>(
    () => Object.fromEntries(initialRoster.map((r) => [r.studentId, r.status])),
  );
  const [pending, setPending] = useState<Set<string>>(() => new Set());
  const pendingRef = useRef<Set<string>>(new Set());
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);
  const [neighborhood, setNeighborhood] = useState<string>(ALL);

  const isJoint = neighborhoods.length > 1;

  // Danh sách theo Khu phố đang chọn (trước khi lọc tìm kiếm) — dùng cho bộ đếm.
  const scoped = useMemo(
    () =>
      neighborhood === ALL
        ? initialRoster
        : initialRoster.filter((r) => r.neighborhoodId === neighborhood),
    [initialRoster, neighborhood],
  );

  const counters = useMemo(() => {
    let present = 0;
    let excused = 0;
    let unexcused = 0;
    let notMarked = 0;
    for (const r of scoped) {
      const s = statuses[r.studentId] ?? null;
      if (s === "PRESENT") present += 1;
      else if (s === "EXCUSED") excused += 1;
      else if (s === "UNEXCUSED") unexcused += 1;
      else notMarked += 1;
    }
    return { present, excused, unexcused, notMarked };
  }, [scoped, statuses]);

  const filtered = useMemo(() => {
    const term = deferredQuery.trim().toLowerCase();
    if (!term) return scoped;
    return scoped.filter(
      (r) =>
        r.fullName.toLowerCase().includes(term) ||
        (r.guardianPhone ?? "").toLowerCase().includes(term),
    );
  }, [scoped, deferredQuery]);

  const handleSelect = useCallback(
    async (studentId: string, value: MarkValue) => {
      if (pendingRef.current.has(studentId)) return; // guard same-tick double-clicks
      const nextStatus = markValueToStatus(value);
      const prevStatus = statuses[studentId] ?? null;
      if (nextStatus === prevStatus) return;

      pendingRef.current.add(studentId);
      setStatuses((s) => ({ ...s, [studentId]: nextStatus }));
      setPending((p) => new Set(p).add(studentId));

      try {
        const res = await markAttendanceAction({ sessionId, studentId, status: value });
        if (!res.ok) {
          setStatuses((s) => ({ ...s, [studentId]: prevStatus }));
          error(res.error ?? "Không thể cập nhật điểm danh.");
        } else {
          success("Đã cập nhật điểm danh.");
        }
      } catch {
        setStatuses((s) => ({ ...s, [studentId]: prevStatus }));
        error("Lỗi kết nối. Vui lòng thử lại.");
      } finally {
        pendingRef.current.delete(studentId);
        setPending((p) => {
          const n = new Set(p);
          n.delete(studentId);
          return n;
        });
      }
    },
    [statuses, sessionId, success, error],
  );

  return (
    <div className="space-y-3">
      {isJoint ? (
        <div className="flex flex-wrap items-center gap-2 rounded-lg border border-indigo-100 bg-indigo-50/50 px-3 py-2">
          <span className="text-xs font-medium text-slate-600">Khu phố điểm danh:</span>
          <button
            type="button"
            onClick={() => setNeighborhood(ALL)}
            className={
              "h-7 rounded-md px-2.5 text-xs font-medium " +
              (neighborhood === ALL ? "bg-indigo-600 text-white" : "bg-white text-slate-700 hover:bg-slate-100")
            }
          >
            Tất cả ({initialRoster.length})
          </button>
          {neighborhoods.map((n) => {
            const count = initialRoster.filter((r) => r.neighborhoodId === n.id).length;
            return (
              <button
                key={n.id}
                type="button"
                onClick={() => setNeighborhood(n.id)}
                className={
                  "h-7 rounded-md px-2.5 text-xs font-medium " +
                  (neighborhood === n.id ? "bg-indigo-600 text-white" : "bg-white text-slate-700 hover:bg-slate-100")
                }
              >
                {n.name} ({count})
              </button>
            );
          })}
        </div>
      ) : null}

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Counter label="Có mặt" value={counters.present} tone="text-emerald-700" />
        <Counter label="Nghỉ có phép" value={counters.excused} tone="text-amber-700" />
        <Counter label="Nghỉ không phép" value={counters.unexcused} tone="text-rose-700" />
        <Counter label="Chưa điểm danh" value={counters.notMarked} tone="text-slate-600" />
      </div>

      <div className="flex items-center gap-2">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Tìm theo tên học sinh hoặc SĐT phụ huynh…"
          className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
        />
        <span className="shrink-0 text-xs text-slate-400">{filtered.length} học sinh</span>
      </div>

      <div className="max-h-[62vh] overflow-y-auto rounded-xl border border-slate-200 bg-white">
        {filtered.length === 0 ? (
          <p className="px-4 py-6 text-center text-sm text-slate-500">
            {deferredQuery
              ? "Không tìm thấy học sinh phù hợp."
              : "Không có học sinh nào thuộc Khu phố của buổi này."}
          </p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {filtered.map((r) => {
              const status = statuses[r.studentId] ?? null;
              const isPending = pending.has(r.studentId);
              return (
                <li
                  key={r.studentId}
                  className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="min-w-0">
                      <span className="font-medium text-slate-900">{r.fullName}</span>
                      {r.guardianPhone ? (
                        <span className="ml-2 text-xs text-slate-400">PH: {r.guardianPhone}</span>
                      ) : null}
                    </div>
                    {status ? (
                      <Badge tone={ATTENDANCE_TONE[status]}>{ATTENDANCE_STATUS_LABEL[status]}</Badge>
                    ) : (
                      <Badge tone="slate">Chưa điểm danh</Badge>
                    )}
                  </div>
                  {locked ? (
                    <span className="text-xs text-slate-400">Đã khóa</span>
                  ) : (
                    <AttendanceStatusButtons
                      current={status ?? NOT_MARKED}
                      pending={isPending}
                      onSelect={(value) => handleSelect(r.studentId, value)}
                    />
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

function Counter({ label, value, tone }: { label: string; value: number; tone: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2">
      <p className="text-xs text-slate-500">{label}</p>
      <p className={`text-xl font-semibold ${tone}`}>{value}</p>
    </div>
  );
}
