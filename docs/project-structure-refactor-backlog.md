# Backlog cải thiện cấu trúc dự án (Structure Refactor Backlog)

> Tạo ở **Prompt 10A**. Danh sách việc **nên cải thiện sau**, chia theo phase, ưu tiên an toàn.
> **KHÔNG làm ngay** nếu rủi ro phá import/nghiệp vụ. Bổ trợ (không thay thế)
> [`project-repair-backlog.md`](./project-repair-backlog.md) — file đó theo dõi nợ tính năng/vận hành;
> file này chỉ theo dõi nợ **cấu trúc thư mục & tài liệu**.

Tham chiếu đánh giá: [`project-structure-audit.md`](./project-structure-audit.md) ·
Chuẩn đích: [`folder-architecture-standard.md`](./folder-architecture-standard.md).

---

## Phase 1 — Sửa tài liệu lệch (RẺ, AN TOÀN, làm sớm)

> Chỉ sửa docs/README, không đụng code → rủi ro gần như 0. Nên là prompt kế tiếp.

- [ ] **Cập nhật `README.md`** theo trạng thái thật (đang ghi sai "Phase 1 — Scaffold"; thực tế tới 09C:
      Auth/CRUD/Attendance/Leave/DOCX/AI import thật). Cập nhật danh sách route + scripts (`preflight`,
      `bootstrap:auth`) + stack.
- [ ] **Vẽ lại sơ đồ trong `docs/architecture.md`** khớp cây thật: route groups `admin/(auth|portal)`,
      `user/(auth)`, `user/secretary`, `user/parent`, `change-password`, dynamic `[sessionId]`; và **ghi rõ
      hiện trạng**: business logic ở `src/lib/`, `src/modules/*` là skeleton phần lớn rỗng.
- [ ] Trỏ `architecture.md` và `README.md` sang `folder-architecture-standard.md` làm chuẩn đích.

## Phase 2 — Chốt quyết định `src/modules/` (RỦI RO TRUNG BÌNH — cần test)

> Đây là nợ kiến trúc **CAO** nhưng **không được làm vội**: chạm import ở nhiều nơi.

- [ ] **Quyết định hướng A hay B** (xem `folder-architecture-standard.md` mục 4). Khuyến nghị **Hướng A**
      cho quy mô hiện tại: giữ domain enum thật, bỏ tầng `application/`+`infrastructure/` rỗng.
- [ ] Lập danh sách import thật từ `@/modules/*` (chỉ vài file `domain/*` được dùng: attendance-status,
      roles, staff-title, leave-status, session-type, scope-type…). Xác nhận `application/` và
      `infrastructure/` = `export {}` không ai import.
- [ ] **Di chuyển từng bước** (nếu chọn A): move domain thật sang nơi đã chốt (vd `src/lib/domain/*`),
      cập nhật import, xóa skeleton rỗng. Mỗi bước: typecheck + build + smoke RLS xanh mới sang bước sau.
- [ ] Cập nhật `architecture.md` sau khi dọn để docs khớp code.

## Phase 3 — Chuẩn hóa nơi đặt type/config (THẤP, tùy chọn)

- [ ] Cân nhắc gom type global về `src/types/` (re-export `database.types.ts`) — chỉ khi type bắt đầu
      khó tìm; không bắt buộc.
- [ ] Cân nhắc `src/config/` cho hằng số cấu hình (nav, giới hạn) nếu config phình. Hiện `env.ts` +
      `nav-config.ts` vẫn ổn.
- [ ] Ghi quy ước đặt tên file vào `folder-architecture-standard.md` (đã có) và tham chiếu trong PR review.

## Phase 4 — Test tự động trong CI (TRUNG BÌNH, giá trị cao)

- [ ] Đưa RLS smoke test (hiện SQL chạy tay) vào CI: pgTAP hoặc script ký tên client thật với DB ephemeral.
- [ ] Thêm job `test` vào `.github/workflows/ci.yml` (song song lint/typecheck/build).
- [ ] (Sau) unit test cho chuẩn hóa AI import, DOCX writer, helper auth.

## Phase 5 — Dọn dẹp nhỏ (THẤP)

- [ ] Xóa `src/components/ui/DemoNotice.tsx` nếu vẫn không render (đã ở `project-repair-backlog`).
- [ ] Đồng bộ Postgres local `major_version` 15→17 (chỉ ảnh hưởng dev).

---

## Không nên làm ngay (tránh lan man / rủi ro)

- **Không** refactor toàn bộ sang `src/features/` trong một lần — sẽ đụng hàng loạt import; làm dần có test.
- **Không** đổi path alias `@/*` hay di chuyển `src/lib/data/*` khi chưa có test bao phủ.
- **Không** thêm framework/thư viện kiến trúc nặng (nest-style, DI container) cho quy mô hiện tại.
- **Không** đổi cấu trúc `supabase/migrations` hay đổi tên migration đã áp remote.
- **Không** gộp/tách route đang chạy production khi chưa cần — ưu tiên sửa docs trước.

## Thứ tự ưu tiên đề xuất

1. **Phase 1 (sửa docs)** — rẻ, an toàn, giá trị tức thì cho dev mới/onboarding.
2. **Phase 4 (test CI)** — chặn regression trước khi mở rộng team.
3. **Phase 2 (chốt `src/modules/`)** — hết nợ kiến trúc, cần test từ Phase 4 hỗ trợ.
4. **Phase 3 & 5 (chuẩn hóa type/config, dọn dẹp)** — làm khi tiện.
</content>
