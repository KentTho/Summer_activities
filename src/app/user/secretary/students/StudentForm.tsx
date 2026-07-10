"use client";

import { useActionState, useEffect, useRef } from "react";
import Link from "next/link";
import { Button, Card } from "@/components/ui";
import { createStudent, updateStudent, type StudentActionState } from "./actions";
import type { StudentRow, NeighborhoodRow } from "@/lib/data/students";

interface StudentFormProps {
  mode: "create" | "edit";
  neighborhoods: NeighborhoodRow[];
  student?: StudentRow;
}

const inputCls =
  "h-10 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100";

export function StudentForm({ mode, neighborhoods, student }: StudentFormProps) {
  const action = mode === "edit" ? updateStudent : createStudent;
  const [state, formAction, pending] = useActionState<StudentActionState, FormData>(
    action,
    {},
  );
  const formRef = useRef<HTMLFormElement>(null);

  // Sau khi TẠO thành công thì xóa trắng form để nhập tiếp.
  useEffect(() => {
    if (state.ok && mode === "create") formRef.current?.reset();
  }, [state.ok, mode]);

  return (
    <Card title={mode === "edit" ? "Sửa học sinh" : "Thêm học sinh"}>
      <form ref={formRef} action={formAction} className="grid gap-3 sm:grid-cols-2">
        {mode === "edit" && student ? (
          <input type="hidden" name="id" value={student.id} />
        ) : null}

        <div className="sm:col-span-2">
          <label className="mb-1 block text-xs font-medium text-slate-600">
            Họ tên <span className="text-red-500">*</span>
          </label>
          <input
            name="full_name"
            required
            defaultValue={student?.full_name ?? ""}
            placeholder="Nguyễn Văn A"
            className={inputCls}
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">
            Năm sinh
          </label>
          <input
            name="birth_year"
            inputMode="numeric"
            maxLength={4}
            defaultValue={student?.birth_year ? String(student.birth_year) : ""}
            placeholder="VD 2015"
            className={inputCls}
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">
            Ngày sinh
          </label>
          <input
            name="birth_date"
            type="date"
            defaultValue={student?.birth_date ?? ""}
            className={inputCls}
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">Giới tính</label>
          <select name="gender" defaultValue={student?.gender ?? ""} className={inputCls}>
            <option value="">Chưa rõ</option>
            <option value="MALE">Nam</option>
            <option value="FEMALE">Nữ</option>
            <option value="OTHER">Khác</option>
            <option value="UNKNOWN">Chưa xác định</option>
          </select>
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">Có chữ ký?</label>
          <select
            name="signature_present"
            defaultValue={
              student?.signature_present === true
                ? "true"
                : student?.signature_present === false
                  ? "false"
                  : ""
            }
            className={inputCls}
          >
            <option value="">Chưa rõ</option>
            <option value="true">Có</option>
            <option value="false">Không</option>
          </select>
        </div>

        <div className="sm:col-span-2">
          <label className="mb-1 block text-xs font-medium text-slate-600">Ghi chú chữ ký</label>
          <input
            name="signature_note"
            defaultValue={student?.signature_note ?? ""}
            placeholder="VD: ký ở cột 5 (không lưu ảnh chữ ký)"
            className={inputCls}
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">
            SĐT phụ huynh
          </label>
          <input
            name="guardian_phone"
            inputMode="tel"
            defaultValue={student?.guardian_phone ?? ""}
            placeholder="09xxxxxxxx"
            className={inputCls}
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">
            Tên phụ huynh
          </label>
          <input
            name="guardian_name"
            defaultValue={student?.guardian_name ?? ""}
            className={inputCls}
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">
            Trường
          </label>
          <input
            name="school"
            defaultValue={student?.school ?? ""}
            className={inputCls}
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">
            Khu phố <span className="text-red-500">*</span>
          </label>
          <select
            name="neighborhood_id"
            required
            defaultValue={student?.neighborhood_id ?? neighborhoods[0]?.id ?? ""}
            className={inputCls}
          >
            {neighborhoods.map((n) => (
              <option key={n.id} value={n.id}>
                {n.name}
              </option>
            ))}
          </select>
        </div>

        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            name="active"
            defaultChecked={student ? student.active : true}
            className="h-4 w-4"
          />
          Đang hoạt động
        </label>

        <div className="flex items-center gap-3 sm:col-span-2">
          <Button type="submit" disabled={pending} className="h-10 px-4">
            {pending
              ? "Đang lưu…"
              : mode === "edit"
                ? "Lưu thay đổi"
                : "Thêm học sinh"}
          </Button>
          {mode === "edit" ? (
            <Link
              href="/user/secretary/students"
              className="text-sm text-slate-500 hover:underline"
            >
              Hủy
            </Link>
          ) : null}
          {state.error ? (
            <span role="alert" className="text-sm text-red-600">
              {state.error}
            </span>
          ) : null}
          {state.ok ? (
            <span className="text-sm text-green-600">Đã lưu.</span>
          ) : null}
        </div>
      </form>
    </Card>
  );
}
