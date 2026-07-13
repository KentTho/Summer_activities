"use client";

/**
 * Roster điểm danh optimistic (10E).
 * - Nhận roster ban đầu từ server (đã qua RLS). Không truy vấn DB ở client.
 * - Click trạng thái: cập nhật local ngay, khóa đúng hàng đang gửi, gọi server
 *   action; thành công → toast, thất bại → rollback + toast lỗi.
 * - Bộ đếm tổng cập nhật optimistic theo local state.
 * - Tìm kiếm client-side (debounce bằng useDeferredValue) — không reload trang,
 *   không mất vị trí cuộn.
 */
import { useCallback, useDeferredValue, useMemo, useState } from "react";
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
  guardianPhone: string | null;
  status: AttendanceStatus | null;
}

function markValueToStatus(value: MarkValue): AttendanceStatus | null {
  return value === NOT_MARKED ? null : value;
}

export function AttendanceRosterClient({
  sessionId,
  initialRoster,
  locked,
}: {
  sessionId: string;
  initialRoster: RosterClientEntry[];
  locked: boolean;
}) {
  const { success, error } = useToast();

  // Trạng thái điểm danh theo studentId (nguồn sự thật ở client cho optimistic UI).
  const [statuses, setStatuses] = useState<Record<string, AttendanceStatus | null>>(
    () => Object.fromEntries(initialRoster.map((r) => [r.studentId, r.status])),
  );
  const [pending, setPending] = useState<Set<string>>(() => new Set());
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);

  const counters = useMemo(() => {
    let present = 0;
    let excused = 0;
    let unexcused = 0;
    let notMarked = 0;
    for (const r of initialRoster) {
      const s = statuses[r.studentId] ?? null;
      if (s === "PRESENT") present += 1;
      else if (s === "EXCUSED") excused += 1;
      else if (s === "UNEXCUSED") unexcused += 1;
      else notMarked += 1;
    }
    return { present, excused, unexcused, notMarked };
  }, [initialRoster, statuses]);

  const filtered = useMemo(() => {
    const term = deferredQuery.trim().toLowerCase();
    if (!term) return initialRoster;
    return initialRoster.filter(
      (r) =>
        r.fullName.toLowerCase().includes(term) ||
        (r.guardianPhone ?? "").toLowerCase().includes(term),
    );
  }, [initialRoster, deferredQuery]);

  const handleSelect = useCallback(
    async (studentId: string, value: MarkValue) => {
      if (pending.has(studentId)) return; // chống race/double-click
      const nextStatus = markValueToStatus(value);
      const prevStatus = statuses[studentId] ?? null;
      if (nextStatus === prevStatus) return; // không đổi → bỏ qua

      // Optimistic: đổi ngay + khóa hàng.
      setStatuses((s) => ({ ...s, [studentId]: nextStatus }));
      setPending((p) => new Set(p).add(studentId));

      try {
        const res = await markAttendanceAction({ sessionId, studentId, status: value });
        if (!res.ok) {
          setStatuses((s) => ({ ...s, [studentId]: prevStatus })); // rollback
          error(res.error ?? "Không thể cập nhật điểm danh.");
        } else {
          success("Đã cập nhật điểm danh.");
        }
      } catch {
        setStatuses((s) => ({ ...s, [studentId]: prevStatus }));
        error("Lỗi kết nối. Vui lòng thử lại.");
      } finally {
        setPending((p) => {
          const n = new Set(p);
          n.delete(studentId);
          return n;
        });
      }
    },
    [pending, statuses, sessionId, success, error],
  );

  return (
    <div className="space-y-3">
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
