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

---

## Cập nhật — Sửa lỗi UI + hoàn thiện trải nghiệm chơi Online (đợt 2)

> Phiên làm việc này xử lý 1 tài liệu bàn giao (handover doc) từ
> "Antigravity" — công cụ người dùng dùng để tự test/debug sau khi nhận
> code multiplayer ở mục trên — tổng hợp các lỗi/yêu cầu phát hiện được.
> Đã đọc kỹ, tự kiểm tra lại từng điểm trên code thật (không tin mù
> quáng), và triển khai lại theo cách chuẩn xác hơn ở vài chỗ.

### Đã sửa

**UI/UX:**
- Thêm `<Header />` vào `/games/xiangqi` (trước đó thiếu hẳn).
- **Phát hiện nguyên nhân gốc** khiến quân Cờ Tướng màu Đen "tàng hình" ở
  Light Mode: dự án toggle theme bằng class `html.light` (mặc định root
  đã là dark), **không phải** quy ước `.dark`/`prefers-color-scheme`
  chuẩn của Tailwind — nên mọi class `dark:` trong codebase đều phản ứng
  sai (theo cấu hình hệ điều hành, không theo nút bấm thật trên web). Đã
  sửa tận gốc: thêm semantic CSS variables `--xq-*` (khai báo riêng cho
  cả `:root` và `html.light`) cho toàn bộ màu bàn cờ/quân cờ Xiangqi,
  không dùng `dark:` nữa. Tiện thể tìm và sửa luôn 2 chỗ khác trong
  codebase có cùng lỗi này (`SetupScreen.tsx` của Xiangqi, `Cell.tsx` của
  Minesweeper) dù không được báo cáo trực tiếp.
- **Phát hiện thêm**: toàn bộ 5 component multiplayer viết ở đợt 1
  (`RoomLobby`, `WaitingRoom`, `RoundResultPanel`, `ChatDrawer`,
  `OpenRoomsBrowser`) được viết TRƯỚC KHI người dùng tự thêm hệ thống
  token semantic (`--background`, `--foreground`, `--surface`, `--muted`...)
  vào `globals.css`, nên vẫn dùng token cũ (`ink-400`, `paper-100`...) —
  cùng lớp lỗi sẽ hiển thị sai ở Light Mode. Đã thay toàn bộ sang token
  semantic mới.

**Trải nghiệm chơi Online — thêm mới:**
- 3 nút **Đầu hàng / Cầu hoà / Rời phòng** hiển thị trong lúc đang chơi
  (cả 3 game: Caro, Cờ vua, Cờ tướng), thay `window.confirm()` bằng
  `ConfirmActionModal` tự thiết kế.
- Cầu hoà lưu trực tiếp vào `rooms.game_state` (cột jsonb có sẵn, không
  cần migration mới) qua field `drawOfferFromSlot`/`resignedBySlot` —
  đồng bộ qua Postgres Changes, không qua Broadcast nên không lo bị miss
  khi 1 bên mạng chập chờn. Đối thủ thấy banner "X đang xin hoà" với 2
  nút Đồng ý/Từ chối.
- **Rời phòng**: gọi `leave()` xoá record khỏi DB **và** điều hướng cứng
  `window.location.href = "/"` (không chỉ unmount component) để đảm bảo
  dọn sạch toàn bộ state SPA. Rời phòng giữa ván tính là đầu hàng, đối
  thủ được xử thắng ngay lập tức.
- **Thay người chơi giữa chừng**: sửa `joinRoom()` trong `rooms.ts` để
  cho phép tham gia khi phòng đang `round_finished` (trước đây chỉ cho
  join lúc `waiting`, chặn hẳn việc thay người) — khi 1 người rời phòng
  đang chơi dở, người còn lại được xử thắng ngay và slot trống có thể
  đón người chơi thứ 3 vào ngay trong phòng đó.
- **Bỏ hẳn logic "ép về lại phòng cũ"** khi tạo phòng mới (`createRoom`
  trước đây tự tìm phòng cũ theo identity và bắt vào lại phòng đó) — theo
  đúng yêu cầu, giờ luôn tạo phòng mới hoàn toàn. Việc quay lại đúng
  phòng đang chơi dở khi F5 được xử lý bằng cách khác: đồng bộ mã phòng
  lên URL (`?room=...`) ngay khi tạo/tham gia phòng (`history.replaceState`,
  không điều hướng/reload), rồi đọc lại đúng mã đó khi trang được tải lại.

### Bug thật đã tìm thấy và sửa (đúng như tài liệu bàn giao mô tả, đã tự xác minh lại)

1. **Auto-rematch-loop**: cờ `isReady` không được reset về `false` sau
   khi ván ĐẦU TIÊN bắt đầu (chỉ có reset cho ván thứ 2 trở đi/rematch,
   thiếu cho lần bắt đầu đầu tiên) — khiến ván đầu vừa kết thúc là tự
   động vào ván mới ngay lập tức không cần hỏi. Đã thêm `resetReadyFlags()`
   ngay sau `startRoomRound()` cho cả 3 game.
2. **Stale closure khi báo cáo kết quả ván mới**: thêm guard kiểm tra dữ
   liệu THẬT trên phòng (remote `game_state`) trước khi tin tưởng
   `status`/`winner` cục bộ — nếu remote cho thấy round vừa bắt đầu lại
   (rỗng, chưa có cờ kết quả nào) thì bỏ qua, không báo cáo kết quả cũ.

### Đã tự kiểm chứng bằng cách chạy thật

- [x] `npx tsc --noEmit` và `npm run lint` → sạch hoàn toàn (0 lỗi).
- [x] `npm run test` → **90/90 pass** (thêm 6 test mới cho `applyOnlineResult`
      của cả 3 game: đầu hàng xác định đúng người thắng, cầu hoà đặt đúng
      trạng thái hoà).
- [x] `npm run build` → thành công, đủ 8 route.
- [x] Standalone production server chạy thật + curl xác nhận mọi route
      (kể cả kèm `?room=MÃ`) đều trả `200`, không crash.
- [x] Kiểm tra trực tiếp trong CSS đã build ra: xác nhận cả 2 giá trị
      (dark/light) của các biến `--xq-*` đều có mặt đúng vị trí.

### Vẫn giữ nguyên giới hạn đã ghi nhận trước đó

- ⚠️ Vẫn **không thể tự test luồng 2 người chơi thật qua Supabase Realtime**
  từ sandbox này (không có quyền mạng tới domain Supabase) — bạn cần tự
  kiểm thử theo `SETUP_MULTIPLAYER.md`, đặc biệt các luồng MỚI thêm ở đợt
  này (đầu hàng, cầu hoà, rời phòng giữa ván, thay người chơi, F5 reconnect
  qua URL) vì đây là những luồng phức tạp nhất, dễ có edge case chưa lường hết.
- Chưa implement "xử thắng tự động sau X giây mất kết nối" — vẫn chỉ có
  banner cảnh báo, người chơi phải tự bấm Rời phòng hoặc Đầu hàng nếu
  muốn kết thúc sớm khi đối thủ mất kết nối lâu.


---

## Cập nhật — Đợt 3: Xếp hạng (Elo), Hồ sơ, sửa Cờ tướng & luồng phòng

> Phiên làm việc này nâng GameHub online thành sản phẩm hoàn chỉnh hơn theo
> yêu cầu: sửa lỗi trải nghiệm Cờ tướng, thêm **xếp hạng**, làm lại trang
> **Hồ sơ**, và tăng độ bền cho **luồng tạo/vào phòng**. Migration DB đã được
> đẩy thật lên project Supabase đã link (`fvoygbylguvsilwleljo`).

### A. Cờ tướng + game online

- **Lật bàn cờ cho người chơi quân Đen (online)**: trước đây người cầm quân
  Đen luôn nhìn bàn từ phía Đỏ (quân mình ở nửa xa, rất khó chơi). Nay bàn tự
  xoay 180° khi `onlineColor === "b"` — chỉ xoay lớp lưới quân (lớp đường kẻ +
  chữ "sông" đối xứng dọc nên giữ nguyên là đúng), quân được xoay ngược lại để
  chữ đọc đúng chiều. **Toạ độ logic không đổi** nên không phải sửa engine.
- **Cảnh báo Tướng bị chiếu**: tô vòng đỏ nhấp nháy quanh Tướng của bên tới
  lượt khi đang bị chiếu (dùng `isKingInCheck` sẵn có).
- **6 unit test engine mới** (`xiangqi/__tests__/engine.test.ts`): flying
  general chặn nước để lộ 2 Tướng, phát hiện chiếu bí đúng, còn đường thoát thì
  không phải chiếu bí, luật Tốt. Cờ vua đã tự lật bàn cho quân Đen từ trước.

### B. Xếp hạng Elo + Bảng xếp hạng (chỉ người đã đăng nhập)

- Bảng `player_stats` (`migration 0004_leaderboard.sql`) — 1 dòng/user/game,
  điểm khởi đầu 1000, RLS chỉ cho ghi điểm của chính mình (`auth.uid() = user_id`).
- `src/lib/multiplayer/rating.ts` — Elo thuần (K=32), **8 unit test** riêng.
- Mô hình **self-report**: mỗi client tự ghi kết quả của mình khi ván kết thúc
  → chỉ ghi đúng 1 dòng của mình (khớp RLS), không cần "người báo cáo" duy
  nhất, không race. Khách không được xếp hạng; nuốt lỗi nếu bảng chưa migrate.
- Trang `/leaderboard` (tab theo game) + link ở Header. Tích hợp ghi điểm vào
  cả 3 game online.

### C. Trang Hồ sơ

- Thẻ **thành tích online** mỗi game (rating + T/H/B + số ván).
- Lịch sử chơi **mọi game** (trước chỉ Sudoku).
- **Đổi tên hiển thị** (user ghi `profiles.username`, khách ghi localStorage) —
  tên này dùng luôn khi vào phòng online.

### D. Luồng phòng chắc chắn hơn

- **Host migration** (bug thật đã sửa): chủ phòng = người có slot nhỏ nhất còn
  trong phòng. Trước đây `isHost = slot 0` cứng → nếu chủ phòng gốc rời đi thì
  luồng "bắt đầu ván / chơi lại" kẹt cứng.
- **Kick**: chủ phòng mời người khác ra khỏi phòng chờ; client bị mời tự phát
  hiện (qua realtime) và về sảnh kèm thông báo.
- **Chơi nhanh (Quick match)**: tự tìm phòng còn chỗ để vào, không có thì tạo mới.
- **Sảnh phòng tự cập nhật** mỗi 5s, liệt kê cả phòng vừa xong ván còn slot
  trống (thay người giữa chừng), hiện số người hiện tại/tối đa.
- **Chia sẻ** phòng: nút chép mã + chép/chia sẻ link (Web Share API nếu có).

### Đã tự kiểm chứng bằng cách chạy thật

- [x] `npx tsc --noEmit` sạch, `npm run lint` **0 error**.
- [x] `npm run test` → **104/104 pass** (thêm 8 test Elo + 6 test engine cờ tướng).
- [x] `npm run build` → thành công, xuất hiện route `/leaderboard`.
- [x] `supabase db push` → migration `0004_leaderboard.sql` đã áp dụng thật lên
      project `fvoygbylguvsilwleljo` (0001–0003 đã có từ trước).

### Giới hạn còn lại

- ⚠️ Vẫn cần **tự kiểm thử 2 tab thật** cho các luồng mới (kick, host
  migration, quick match, ghi điểm Elo 2 phía) — logic/type/build đã xanh nhưng
  hành vi realtime nhiều người chỉ chắc chắn khi chạy thật.
- Xếp hạng ghi từ client (RLS đã siết `auth.uid() = user_id`) — có thể nâng cấp
  chống gian lận bằng Edge Function sau (đã có mẫu `validate-move`).
- Chưa có "xem phòng" (spectate) cho người ngoài — đề xuất làm ở đợt sau.

---

## Cập nhật — v3: Game mới + online chắc hơn + âm thanh

> Phiên tự chạy liên tục (autonomous). Branch `claude/gamehub-v3` gộp toàn bộ
> v2 (PR #3) + game 2048 (PR #4) rồi thêm loạt tính năng dưới đây.

### Thêm mới
- 🎮 **Bốn quân (Connect Four)** — game cờ mới: engine thuần (findWinLine 4
  hướng, AI biết thắng/chặn/tránh bẫy) + 10 test; chơi **2 người / với máy /
  online** (đồng bộ qua `movesHistory` cột, ghi điểm Elo, đủ đầu hàng/cầu hoà).
  Route `/games/connect4`.
- 🎮 **2048** — game giải đố offline: engine thuần + 13 test, phím/vuốt, kỷ lục.
- 🔌 **Tự xử thắng khi đối thủ mất kết nối > 30s** — hook dùng chung
  `useOpponentTimeout`, banner đếm ngược, nối vào cả 4 game online.
- 🔊 **Âm thanh hiệu ứng** (WebAudio, không cần asset) + nút tắt tiếng ở Header;
  âm thắng/thua ở màn kết quả online (dùng chung 4 game), Bốn quân, 2048.
- 🧹 Dọn nợ: fix import vitest test Minesweeper, gỡ eslint-disable thừa.

### Đã tự kiểm chứng
- [x] `npx tsc --noEmit` sạch · `npm run lint` **0 error**.
- [x] `npm run test` → **127/127 pass** (thêm 10 test Bốn quân + 13 test 2048).
- [x] `npm run build` → có route `/games/connect4`, `/games/2048`, `/leaderboard`.

### Còn lại / đề xuất tiếp — xem `ROADMAP.md`
- Spectate (xem phòng), replay ván online, hồ sơ công khai, tùy chỉnh thời gian
  phòng, Reversi/Wordle, chống gian lận xếp hạng bằng Edge Function, test E2E.
