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

---

## Cập nhật — Tính năng chơi Online (Caro, Cờ vua, Cờ tướng)

> Mục này ghi lại 1 phiên làm việc riêng, thực hiện trên repo đã có sẵn
> nhiều game do người dùng tự thêm (Chess, Xiangqi, Solitaire...) từ
> phiên bản v1 ban đầu ở trên. Xem đầy đủ kế hoạch thiết kế tại
> `ONLINE_MULTIPLAYER_PLAN.md` và hướng dẫn cài đặt tại `SETUP_MULTIPLAYER.md`.

### Đã làm & đã tự kiểm chứng bằng cách chạy thật

- [x] Cả 4 giai đoạn trong kế hoạch: (1) hạ tầng dùng chung (phòng, mã
      phòng, guest identity, hook realtime), (2)+(3) tích hợp online vào
      Caro/Cờ vua/Cờ tướng, (4) sảnh chung liệt kê phòng + lịch sử ván
      đấu (tuỳ chọn) + code tham khảo cho nâng cấp server-side validation.
- [x] `npm run test` → **84/84 pass**, gồm 20 test mới validate kỹ logic
      đồng bộ online (`syncRemoteBoard`/`syncRemoteState` của cả 3 game):
      từ chối dữ liệu hỏng/giả mạo, phát hiện đúng chiếu bí qua PGN, phát
      hiện đúng thắng cuộc qua chuỗi nước đi Caro/Xiangqi, undo bị vô
      hiệu hoá đúng khi online.
- [x] `npx tsc --noEmit` và `npm run lint` → sạch hoàn toàn (0 lỗi).
      Trong lúc dọn dẹp trước khi bắt đầu, đã sửa luôn 1 số lỗi lint có
      sẵn từ trước trong repo (any types ở Chess Board/Hud/audio.ts, 1
      file test thiếu import vitest, 1 file debug thừa `test-node.js`).
- [x] `npm run build` → thành công, cả 8 route hiện có đều xuất hiện.
- [x] Chạy standalone production server thật (`node .next/standalone/server.js`,
      đúng cách Docker sẽ chạy) + curl xác nhận toàn bộ route trả `200`,
      không crash, không lỗi 500 — kể cả sau khi thêm 3 component
      `*OnlineGame.tsx` mới.
- [x] **Phát hiện và sửa 2 bug thật trong lúc làm** (không phải chỉ viết
      code suông rồi báo xong):
      1. Thiếu hẳn `tick()` (đếm ngược thời gian) trong `ChessOnlineGame.tsx`
         và `XiangqiOnlineGame.tsx` — nếu không sửa, đồng hồ sẽ đứng yên
         khi chơi online (chỉ chạy đúng ở chế độ local vì hàm tick nằm
         trong component local, không được copy sang component online).
      2. Quy tắc "ai báo cáo kết quả ván lên phòng" ban đầu dùng "người
         vừa đi nước cuối" — quy tắc này SAI với trường hợp thắng do đối
         thủ HẾT GIỜ (không có nước đi nào xảy ra lúc đó). Đã sửa thành
         "bên THẮNG luôn là người báo cáo" (áp dụng cho cả Chess và
         Xiangqi), xử lý đúng cả 2 trường hợp chiếu bí lẫn hết giờ.

### Kiến trúc quan trọng cần biết

- Đồng bộ nước đi dùng **Postgres Changes** (cột `rooms.game_state`),
  KHÔNG dùng Broadcast — chỉ Broadcast cho chat. Mỗi nước đi ghi đè 1
  cột, không phải 1 dòng mới, để tránh phình DB.
- Validate 2 chiều ở client: mọi dữ liệu nhận từ phòng đều được **replay
  lại từ đầu qua chính engine cục bộ** (`checkWin`, `getLegalMoves`,
  `chess.js loadPgn`) trước khi áp dụng — dữ liệu hỏng/giả mạo bị từ chối
  và giữ nguyên state cũ thay vì áp dụng mù quáng.
- 1 phòng chơi được nhiều ván (rematch) — có `round_number`, `scoreboard`
  tích luỹ, không cần tạo phòng mới mỗi ván.

### Giới hạn / chưa kiểm chứng được — quan trọng, đọc kỹ trước khi coi là hoàn thiện

- ⚠️ **Chưa test được luồng 2 người chơi thật (2 tab/2 trình duyệt) với
  Supabase Realtime thật** — môi trường sandbox thực hiện task này
  **không có quyền truy cập mạng tới domain Supabase** (danh sách domain
  cho phép chỉ gồm các domain liên quan tới npm/GitHub/PyPI, không có
  `*.supabase.co`). Đã kiểm chứng kỹ mọi thứ có thể kiểm chứng được
  offline (logic, type, build, route load), nhưng **bạn bắt buộc phải tự
  làm bước kiểm thử 2 tab ở mục 4 của `SETUP_MULTIPLAYER.md`** trước khi
  tin tưởng tính năng này hoạt động đúng trên môi trường thật.
- ⚠️ Chưa chạy `docker compose up --build` thật (như đã ghi nhận ở mục
  trước của file này từ phiên làm việc trước) — vẫn đúng cho cả code mới.
- Chưa có server-side move validation (client tự validate lẫn nhau) — đã
  có code tham khảo cho hướng nâng cấp này ở
  `supabase/functions/validate-move/`, nhưng CHƯA nối vào client mặc
  định, xem README trong thư mục đó để biết lý do và cách tự triển khai.
- Xiangqi online chưa tự lật bàn cờ theo góc nhìn quân Đen (xem mục 5
  của `SETUP_MULTIPLAYER.md`).
- Chưa có nút "xử thắng" thủ công khi đối thủ mất kết nối quá lâu — chỉ
  có banner cảnh báo + cron dọn phòng tự động sau ~5-15 phút.
- Sảnh chung phòng đang chờ (`OpenRoomsBrowser`) chỉ fetch theo yêu cầu
  (bấm "Làm mới"), không tự động realtime — quyết định có chủ đích để
  không mở thêm kênh Realtime chỉ cho mục đích duyệt danh sách.

### Việc bạn cần làm trước khi coi tính năng online là "xong"

1. Chạy `supabase/migrations/0002_multiplayer.sql` (bắt buộc) và
   `0003_round_history.sql` (tuỳ chọn) trên Supabase project thật của bạn.
2. Bật Realtime cho bảng `rooms`/`room_players` nếu Dashboard chưa tự bật.
3. Tự kiểm thử 2 tab theo đúng mục 4 của `SETUP_MULTIPLAYER.md` cho cả 3
   game (Caro, Cờ vua, Cờ tướng) — đây là bước duy nhất mình không thể tự
   làm thay bạn trong môi trường này.
4. (Tuỳ chọn) Bật cron `cleanup_stale_rooms` để tự dọn phòng rác.

