# 🎮 KẾ HOẠCH — Thêm dòng game Hành động / Phiêu lưu cho GameHub

> Tài liệu thiết kế — **chưa code**. Mục tiêu: mở rộng GameHub (hiện toàn
> game cờ/giải đố lượt-đi-lượt lại) sang thể loại action realtime, theo
> 2 giai đoạn: **Phase 1** — roguelike 2D đi cảnh kiểu *Dead Cells*,
> **Phase 2** — mecha PvP 3D kiểu *Chiến Cơ Huyền Thoại* (Garena).

## Vì sao tách 2 phase

Hai game tham chiếu khác nhau hoàn toàn về độ khó kỹ thuật:

| | Dead Cells (Phase 1) | Chiến Cơ Huyền Thoại (Phase 2) |
|---|---|---|
| Góc nhìn | 2D side-view, pixel art | 3D third-person, MOBA-lite |
| Chế độ | 1 người chơi (roguelike run) | PvP nhiều người realtime |
| Vật lý | Nhảy/rơi/va chạm 2D | Bắn súng/kỹ năng 3D, hitbox, netcode |
| Hạ tầng online | Không cần (chỉ leaderboard async) | Cần realtime tick-based hoàn toàn mới |
| Rủi ro | Thấp — Phaser lo phần lớn | Cao — hiệu năng WebGL 3D + netcode trên trình duyệt/mobile |

Toàn bộ game hiện tại của GameHub đồng bộ qua **Postgres Changes** (mỗi
nước đi 1 lần ghi DB) — hợp với cờ/giải đố nhưng **không** hợp với combat
thời gian thực (cần 10–20 tick/giây, DB không kham nổi). Vì vậy Phase 2
cần một tầng hạ tầng multiplayer hoàn toàn khác (xem mục 5), không tái
dùng `useOnlineRoom` hiện có. Làm Phase 1 trước để có nền tảng engine
action (input, vòng lặp game, asset pipeline, lưu tiến trình) trước khi
đánh cược vào phần khó nhất.

---

## Lựa chọn công nghệ

### Engine 2D (Phase 1)

| Lựa chọn | Ưu điểm | Nhược điểm |
|---|---|---|
| **Phaser.js (khuyến nghị)** | Framework đầy đủ nhất: physics (Arcade/Matter), tilemap, animation, audio, input, camera — đúng thứ Dead Cells cần. Cộng đồng lớn, nhiều ví dụ platformer/roguelike sẵn. | Bundle to hơn (~1MB), học API riêng của Phaser (scene lifecycle khác React). |
| PixiJS | Nhẹ hơn, chỉ renderer WebGL — kiểm soát tối đa. | Phải tự viết physics, tilemap, state machine animation — nhiều việc hơn hẳn. |
| Kaboom/Kaplay | API rất đơn giản, code nhanh cho game jam. | Ít tính năng nâng cao, cộng đồng nhỏ hơn, khó mở rộng khi game phức tạp dần (roguelike cần nhiều hệ thống: item, buff, procedural room). |

→ **Chọn Phaser.js.** Đánh đổi bundle size hợp lý vì Dead Cells cần nhiều
hệ thống (physics, tilemap, animation state machine, particle) mà Phaser
có sẵn, tự viết bằng Pixi sẽ tốn nhiều tuần chỉ để bắt kịp.

### Engine 3D (Phase 2, tham khảo trước — quyết định lại khi tới Phase 2)

- **Three.js** (hoặc React Three Fiber nếu muốn khai báo kiểu React) —
  lựa chọn mặc định cho 3D trên web, nhẹ hơn Babylon.js, đủ cho mecha
  PvP quy mô nhỏ (không cần engine AAA).
- Babylon.js là lựa chọn thay thế nếu cần công cụ editor/physics tích hợp
  sẵn nhiều hơn, nhưng nặng hơn và ít cần thiết ở quy mô hobby project.

### Tích hợp với Next.js 16 / React 19

- Phaser/Three.js thao tác trực tiếp canvas WebGL, **không** tương thích
  Server Component. Toàn bộ code engine phải nằm trong Client Component
  (`"use client"`), mount canvas trong `useEffect`, tránh re-render React
  đụng vào vòng lặp game (React chỉ render UI overlay: HUD, menu, modal
  game-over — game logic tự chạy trong Phaser scene, không qua React
  state mỗi frame).
- Trước khi code, đọc `node_modules/next/dist/docs/01-app/` phần liên
  quan tới Client Component / dynamic import — bản Next.js này có thể có
  API khác so với training data (theo lưu ý ở `AGENTS.md`). Đặc biệt
  kiểm tra cách `next/dynamic` với `ssr: false` hoạt động ở version hiện
  tại trước khi dùng để load Phaser (Phaser dùng `window`, phải đảm bảo
  không chạy ở server).
- Asset (spritesheet, tilemap JSON, âm thanh) đặt ở `public/games/dead-cells-lite/`
  giống cách các game khác dùng `public/` hiện tại.

---

## Phase 1 — Roguelike 2D kiểu Dead Cells

### Phạm vi MVP (không copy nguyên Dead Cells, lấy đúng công thức cốt lõi)

- 1 nhân vật, di chuyển trái/phải + nhảy + tấn công cận chiến (combo 2–3
  đòn) + né/dash.
- Procedural run: mỗi lần chơi ghép ngẫu nhiên 5–8 phòng từ pool phòng đã
  thiết kế sẵn (không cần procedural generation thuật toán phức tạp ở
  MVP — ghép phòng có sẵn theo pool là đủ "cảm giác roguelike").
- 3–4 loại quái đơn giản (AI: đứng canh / đuổi theo / bắn xa), 1 boss
  cuối run.
- Nhặt vũ khí/buff ngẫu nhiên trong phòng (tăng sát thương, tốc độ, máu).
- Chết → mất run, quay lại hub; **không mất tiến trình vĩnh viễn ở MVP**
  (roguelite meta-progression là mở rộng sau, xem mục "Sau MVP").
- Lưu **kỷ lục cá nhân** (số phòng đã qua xa nhất, thời gian nhanh nhất)
  vào Supabase — bảng mới, không phải `player_stats` (bảng đó là Elo cho
  game đối kháng lượt-đi-lượt, không hợp).

### Cấu trúc thư mục (theo đúng quy ước hiện có của repo)

```
src/games/dead-cells-lite/
  engine/          # logic thuần: entity, combat, room pool, spawn — có unit test
    types.ts
    combat.ts
    roomPool.ts
  phaser/          # scene Phaser — KHÔNG unit test (côi khỏi engine thuần)
    scenes/BootScene.ts
    scenes/GameScene.ts
    scenes/HudScene.ts
  components/
    DeadCellsGame.tsx   # "use client", mount Phaser.Game, overlay React (HUD/menu)
  store.ts          # zustand: chỉ lưu state cần React re-render (HP, run kết quả)
  __tests__/
src/app/games/dead-cells-lite/page.tsx
public/games/dead-cells-lite/   # spritesheet, tileset, audio
```

Giữ đúng triết lý repo: **engine thuần (test được) tách khỏi lớp
render** — chỉ khác là lớp render ở đây là Phaser scene thay vì React
component như các game cờ/giải đố.

### Mốc công việc

1. Dựng khung: route mới, `DeadCellsGame.tsx` mount 1 Phaser scene trống,
   xác nhận build/tsc/lint sạch, canvas chạy được trên Vercel/Docker
   (kiểm tra static asset serving từ `public/`).
2. Nhân vật: sprite, animation state machine (idle/run/jump/attack/hurt),
   physics Arcade, input (bàn phím + chạm cho mobile — GameHub đã có
   PWA, cần hỗ trợ touch).
3. Combat + quái: hitbox tấn công, 1 loại quái, máu/damage, chết/respawn
   quái khi vào phòng mới.
4. Room pool + ghép ngẫu nhiên: 5 phòng mẫu, transition giữa phòng, HUD
   hiện số phòng đã qua.
5. Item/buff nhặt được, boss phòng cuối, màn hình kết quả run.
6. Lưu kỷ lục lên Supabase (bảng mới `run_records` hoặc tương tự), hiện
   trên trang game + có thể thêm vào `/leaderboard` sau.
7. Polish: âm thanh (tái dùng hệ WebAudio đã có), particle khi đánh
   trúng, rung màn hình nhẹ, cân bằng độ khó.

### Việc cần làm ở Supabase

- 1 migration mới: bảng lưu kỷ lục run (user_id nullable cho khách chơi
  local-only, hoặc chỉ lưu leaderboard cho user đăng nhập — quyết định
  khi tới bước 6). Không đụng tới RLS/bảng hiện có.

---

## Phase 2 — Mecha PvP 3D kiểu Chiến Cơ Huyền Thoại (định hướng, chưa chốt chi tiết)

Ghi trước để không quên bối cảnh khi quay lại; **chi tiết kỹ thuật sẽ
lên kế hoạch riêng** (`MECHA_PVP_PLAN.md`) sau khi Phase 1 xong, vì lúc
đó mới rõ engine action đã có gì tái dùng được.

### Vì sao khó hơn nhiều

- Cần vòng lặp mô phỏng phía server (authoritative simulation) hoặc ít
  nhất client-side prediction + reconciliation — nếu không, 1 người chơi
  chỉnh JS console là gian lận vô hạn (khác hẳn game lượt-đi-lượt hiện
  tại, nơi mỗi nước đi có thể validate rời rạc qua Edge Function).
- Supabase Realtime (Postgres Changes/Broadcast) gửi qua Postgres/WS,
  latency và tần suất không hợp cho 10–20 tick/giây combat. Cần đánh giá
  lại: Supabase Realtime Broadcast thuần (không qua Postgres) có đủ
  nhanh không, hay cần 1 dịch vụ WebSocket riêng (ví dụ Node server nhỏ
  chạy cạnh Next.js, hoặc dịch vụ như Colyseus/PartyKit).
- 3D asset (model mecha, animation rig) tốn công thiết kế/tìm asset hơn
  hẳn sprite 2D.

### Hướng tiếp cận đề xuất (sơ bộ, sẽ chốt lại sau)

- Bắt đầu từ **PvP 1v1 quy mô nhỏ** (không phải MOBA 5v5 đầy đủ) — đúng
  tinh thần "học từ Chiến Cơ Huyền Thoại" chứ không phải clone toàn bộ.
- Cân nhắc dùng **PartyKit** hoặc **Colyseus** cho tầng realtime thay vì
  tự viết WebSocket server + tick loop từ đầu — cả 2 đều có SDK
  TypeScript, deploy được cạnh Next.js.
- Three.js + React Three Fiber cho render, tái dùng input/HUD pattern đã
  xây ở Phase 1 nếu hợp.
- Xác nhận lại với người dùng scope thật sự (1v1? có progression/thu
  thập mecha không? mobile có cần hỗ trợ không) trước khi viết plan chi
  tiết — vì đây là quyết định ảnh hưởng lớn tới toàn bộ kiến trúc.

---

## Ghi chú vận hành

- Migrations Supabase: `supabase db push` (project đã link `fvoygbylguvsilwleljo`).
- Quy ước thêm game hiện có (engine thuần + test → store → route →
  card trang chủ) vẫn áp dụng, chỉ thêm lớp `phaser/` (hoặc `three/` ở
  Phase 2) làm lớp render thay vì component React thuần.
- Trước khi code bất kỳ phần nào đụng API Next.js/React mới, đọc
  `node_modules/next/dist/docs/` liên quan — theo lưu ý ở `AGENTS.md`,
  bản Next.js này có breaking changes so với kiến thức huấn luyện.
