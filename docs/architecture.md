# Kiến trúc — Clean Architecture trên Next.js App Router

Giữ tinh thần **domain / application / infrastructure / presentation** nhưng không biến thành
"enterprise monolith". Presentation nằm ở `app/` + `components/`; business logic ở `modules/` theo
**bounded context**.

## Bản đồ thư mục (thực tế đã scaffold)

```
diem-danh-sinh-hoat-he-app/
├─ src/
│  ├─ app/                      # Presentation (App Router)
│  │  ├─ (public)/              #   route công khai (gioi-thieu)
│  │  ├─ (auth)/                #   login shell
│  │  ├─ admin/                 #   dashboard vai trò Admin
│  │  ├─ secretary/             #   dashboard vai trò Bí thư
│  │  ├─ parent/                #   dashboard vai trò Phụ huynh/Học sinh
│  │  └─ api/health/            #   route handler health check
│  ├─ components/               # UI tái sử dụng
│  │  ├─ ui/  layout/  forms/
│  ├─ modules/                  # Bounded context (domain/application/infrastructure)
│  │  ├─ auth/  neighborhoods/  students/  sessions/
│  │  ├─ attendance/  leave-requests/  notifications/
│  │  └─ imports/  exports/  audit/
│  ├─ lib/                      # Hạ tầng dùng chung
│  │  ├─ supabase/  auth/  validation/  security/  utils/  types/
│  │  └─ env.ts
│  └─ proxy.ts                  # Route guard (Next 16 đổi tên từ middleware.ts)
├─ docs/                        # Tài liệu (bản này) + spec gốc
├─ supabase/                    # config.toml, migrations/, seed.sql
└─ .github/workflows/ci.yml     # CI: lint · typecheck · build
```

> **Lưu ý Next 16:** file `middleware.ts` trong spec đã được đổi tên chuẩn thành **`proxy.ts`**
> (cùng vị trí `src/`, cùng vai trò). Xem `node_modules/next/dist/docs/.../proxy.md`.

## Phân lớp

| Lớp | Đặt ở đâu | Chứa gì |
| --- | --- | --- |
| Presentation | `app/`, `components/` | Page, layout, form, server action entrypoint, view-model |
| Application | `modules/*/application` | Use case (tạo session, điểm danh, duyệt import, xuất báo cáo) |
| Domain | `modules/*/domain` | Entity, value object, enum trạng thái, business rule thuần |
| Infrastructure | `modules/*/infrastructure`, `lib/supabase` | Repository Supabase, mapper, storage, DOCX, AI import adapter |

## Nguyên tắc giữ đơn giản
- Không tách package riêng mỗi layer ở MVP.
- Chỉ use case có rule rõ mới cần service ở `application`; CRUD đơn giản = repository + schema Zod.
- Không nhồi mọi thứ vào `lib/`; thuộc domain nào để trong module đó.
- Không viết repository interface trừ khi có ≥ 2 implementation hoặc cần test cô lập.
