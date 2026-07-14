# PROGRESS

Trạng thái: **Hoàn thành phiên bản đầu (v1) — có thể chạy, build, deploy được.**

## Đã làm & đã tự kiểm chứng bằng cách chạy thật

- [x] Khởi tạo Next.js 16 (App Router, TypeScript, Tailwind v4).
- [x] Sudoku engine (generator/solver/validator/hint) — **18/18 unit test pass**
      (`npm run test`), bao gồm test đảm bảo đề luôn có lời giải duy nhất
      và test chống "treo" (node budget) cho trường hợp input bất thường.
      → Trong lúc làm đã phát hiện & sửa 1 lỗi thật: thuật toán digging cho
      độ khó "hard" có thể rơi vào backtracking bùng nổ tổ hợp với input
      bệnh lý; đã thêm giới hạn số node cho cả `solve()` và `countSolutions()`
      để đảm bảo luôn kết thúc nhanh, không bao giờ treo.
- [x] `npm run build` — build thành công (Next.js 16 + Turbopack), 0 lỗi.
- [x] `npm run lint` — 0 lỗi, 0 warning.
- [x] Đã tự bỏ `next/font/google` và chuyển sang system font stack, vì môi
      trường build có thể chặn `fonts.googleapis.com` — đảm bảo build luôn
      thành công bất kể mạng của máy build có hạn chế hay không.
- [x] Đã tự chạy `npm run dev` và **curl kiểm tra thật** các route:
      `/`, `/games/sudoku`, `/auth`, `/profile`, `/manifest.webmanifest`,
      `/sw.js`, `/icons/icon-192.png` → tất cả trả về `200`.
- [x] Đã tự chạy bản build production dưới dạng **standalone server**
      (`node .next/standalone/server.js`, đúng cách Dockerfile sẽ chạy) và
      curl kiểm tra `/`, `/games/sudoku`, icon → tất cả `200`.
- [x] Manifest PWA hợp lệ (đã curl lấy nội dung JSON thực tế để xác nhận),
      đầy đủ icon 192/512 + bản maskable.
- [x] Đã tạo bộ icon PNG thật (không phải placeholder) bằng script raster
      hoá SVG, gồm: favicon.ico, icon 32/192/512, icon maskable 192/512,
      apple-touch-icon 180.
- [x] Sudoku: 3 độ khó, hint có giải thích tiếng Việt, ghi chú (pencil
      marks), highlight hàng/cột/khối + số trùng, undo/redo, timer, animation
      chúc mừng khi thắng.
- [x] Chơi được không cần đăng nhập (guest), tự lưu tiến trình vào
      IndexedDB, tự đồng bộ lên Supabase khi có mạng + đã đăng nhập
      (hàng chờ `pending-sessions`).
- [x] Trang đăng nhập/đăng ký + trang hồ sơ (lịch sử ván chơi), tự chuyển
      sang "chế độ khách" khi chưa cấu hình Supabase thay vì lỗi.
- [x] SQL schema + RLS policies cho `profiles` và `game_sessions`
      (`supabase/migrations/0001_init.sql`).
- [x] Dockerfile (multi-stage, output standalone) + docker-compose.yml + .dockerignore.
- [x] SETUP.md, README.md, .env.example.

## Giới hạn / chưa kiểm chứng được (cần người dùng hoặc phiên làm việc sau xác nhận)

- ⚠️ **Chưa build/run Docker image thật** — môi trường thực hiện việc này
  không có Docker CLI. Đã xác thực cơ chế tương đương (standalone server
  chạy đúng, cùng cấu trúc file mà Dockerfile copy) nhưng bạn nên tự chạy
  `docker compose up --build` một lần để chắc chắn 100% trên máy bạn.
- ⚠️ **Chưa test thật với 1 project Supabase thật** (đăng ký/đăng nhập/RLS)
  vì không có thông tin project của bạn — logic đã viết đúng theo tài liệu
  Supabase (`@supabase/ssr`) và tự chuyển sang guest-mode an toàn khi
  thiếu cấu hình, nhưng bạn cần tự thử luồng đăng nhập thật sau khi điền
  `.env` theo hướng dẫn ở `SETUP.md` mục 4.
- ⚠️ **Chưa chạy Lighthouse audit tự động** trong môi trường này (thiếu
  Chrome headless). Nên tự chạy Lighthouse trong Chrome DevTools sau khi
  deploy để tối ưu thêm nếu cần.
- ⚠️ Sudoku hiện **cho phép nhập số sai và chỉ tô đỏ cảnh báo** (không
  chặn cứng), giống phần lớn app Sudoku phổ biến. Nếu bạn muốn chặn cứng
  không cho nhập sai, có thể đổi nhỏ trong `store.ts` (`inputValue`).
- Chưa có OAuth (Google...), leaderboard, achievements — đã để sẵn kiến
  trúc mở rộng (xem mục 8 trong SETUP.md) nhưng chưa triển khai, đúng như
  phạm vi "v1" ban đầu.

## Gợi ý bước tiếp theo

1. Tạo project Supabase thật, điền `.env`, chạy migration, thử đăng nhập.
2. Tự chạy `docker compose up --build` để xác nhận trên máy bạn.
3. Deploy thử lên Vercel (mục 6 trong SETUP.md).
4. Nếu muốn thêm game mới, xem hướng dẫn "Thêm game mới" ở cuối SETUP.md.
