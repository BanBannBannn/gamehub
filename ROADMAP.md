# GameHub — Roadmap (backlog đề xuất)

Tài liệu này ghi lại các hướng nâng cấp tiếp theo, xếp theo mức độ ưu tiên
và ước lượng công sức. Dùng để chọn việc cho các phiên làm việc sau.

> Bối cảnh: PR "online v2" (xếp hạng Elo, hồ sơ, sửa cờ tướng, luồng phòng)
> đang chờ review. PR này ("2048 + roadmap") thêm 1 game giải đố offline mới
> và bản backlog này.

## ✅ Đã hoàn thành (v3 — branch `claude/gamehub-v3`, PR #5)
- 🎮 **2048** — engine + 13 test, phím/vuốt, kỷ lục, offline.
- 🎮 **Bốn quân (Connect Four)** — engine + 10 test, chơi 2 người / với máy / **online** (Elo).
- 🎮 **Cờ lật (Reversi/Othello)** — engine + 7 test, 2 người / với máy / **online** (AI trọng số vị trí).
- 🔌 **Auto-win khi đối thủ mất kết nối > 30s** — hook chung, 4 game online.
- 🔊 **Âm thanh** WebAudio + nút tắt tiếng.
- 🧹 Fix import vitest test Minesweeper, gỡ eslint-disable thừa (0 lỗi lint).
- (Từ v2/PR #3) Xếp hạng Elo + `/leaderboard`, hồ sơ mới, sửa cờ tướng, luồng phòng.

## Ưu tiên cao (giá trị lớn, công sức vừa)
1. **Xử thắng tự động khi đối thủ mất kết nối quá lâu** (online) — hiện chỉ có
   banner cảnh báo. Dùng Presence + đồng hồ đếm ngược ~30–60s → tự xử thắng.
   *Phụ thuộc: cần test realtime 2 tab.*
2. **Spectate (xem phòng đang chơi)** — cho người ngoài xem ván trực tiếp
   (read-only) bằng cách subscribe `game_state` và replay qua engine sẵn có.
   Cần thêm chế độ "viewer" (không slot) vào 3 component `*OnlineGame`.
3. **Âm thanh & thông báo** — hiệu ứng khi tới lượt / thắng / có tin nhắn chat;
   web notification khi đối thủ vào phòng.
4. **Hồ sơ công khai** — trang `/u/[username]` xem thành tích người khác; link
   từ bảng xếp hạng.

## Ưu tiên trung bình
5. **Lịch sử ván online xem lại** (replay) — đã lưu `final_game_state`, dựng
   trình xem lại từng nước cho Cờ vua/Cờ tướng/Caro.
6. **Bộ đếm thời gian tuỳ chỉnh** cho phòng (5/10/15 phút) — hiện cố định 600s.
   Lưu vào `rooms.settings` (cột jsonb đã có).
7. **Game mới:**
   - **Bốn quân (Connect Four)** — engine nhỏ, tái dùng hạ tầng phòng để chơi online.
   - **Reversi/Othello** — engine vừa, hợp gu "cờ".
   - **Wordle tiếng Việt** — giải đố chữ, hợp mục "Ô chữ" đang để coming-soon.
8. **PWA nâng cao** — cache tốt hơn cho các game mới, nhắc cài app.

## Ưu tiên thấp / kỹ thuật
9. **Chống gian lận xếp hạng** — chuyển ghi điểm sang Supabase Edge Function
   (đã có mẫu `validate-move/`) thay vì client tự ghi.
10. **Dọn nợ kỹ thuật** — sửa các cảnh báo lint còn lại (any types ở Chess,
    stockfish route), xoá file debug thừa. *(Phần lớn đã xử lý ở PR online v2.)*
11. **Test E2E** cho luồng online (Playwright + 2 context) — tự động hoá bước
    kiểm thử 2 tab hiện đang làm tay.

## Ghi chú vận hành
- Migrations Supabase: dùng `supabase db push` (đã link project `fvoygbylguvsilwleljo`).
- Mỗi game mới nên có: engine thuần + unit test, store zustand, route
  `/games/<slug>`, card ở trang chủ. Game online thì thêm `<Game>OnlineGame.tsx`
  dùng `useOnlineRoom` + đăng ký `MULTIPLAYER_CONFIG`.

---

## 🔜 Kế hoạch phiên sau (ưu tiên từ trên xuống)

Trạng thái hiện tại: mọi việc đã chốt ở trên **đã xong** và nằm trong PR #5.
Nếu tiếp tục, đề xuất làm theo thứ tự:

1. ✅ ~~Reversi online~~ — ĐÃ XONG (đẩy nước trực tiếp do có bỏ lượt).
2. **Spectate (xem phòng)** — thêm chế độ "viewer" (không slot) vào các
   `*OnlineGame`: subscribe `game_state`, replay read-only, ẩn nút thao tác.
3. **Tùy chỉnh thời gian phòng** (5/10/15 phút) — lưu `rooms.settings.timeSeconds`,
   đọc khi `startOnlineGame` (Cờ vua/Cờ tướng). Caro/Bốn quân không có đồng hồ.
4. **Replay ván online** — đã lưu `final_game_state`; dựng trình xem lại từng nước.
5. **Hồ sơ công khai** `/u/[username]` + link từ bảng xếp hạng.
6. **Âm thanh "tới lượt" online** — phát `notify` khi `game_state` đổi sang lượt mình.
7. **Game mới**: Wordle tiếng Việt (thay ô "Ô chữ" coming-soon), Tiến lên miền Nam.
8. **Chống gian lận xếp hạng** — chuyển ghi điểm sang Edge Function (mẫu `validate-move/`).
9. **Test E2E** Playwright 2 context cho luồng online (tự động hoá kiểm thử 2 tab).

## Quy ước thêm game (nhắc lại)
Engine thuần + unit test → store zustand → route `/games/<slug>` → card trang chủ.
Game online: thêm `<Game>OnlineGame.tsx` dùng `useOnlineRoom`, đăng ký
`MULTIPLAYER_CONFIG`, ghi điểm qua `recordMyMatchResult`, nối `useOpponentTimeout`.
