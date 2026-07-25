# 🎮 GameHub

Nền tảng web game giải trí trí tuệ, xây trên Next.js 16 (App Router) +
Supabase. Hỗ trợ PWA (cài đặt được, chơi offline), đăng nhập tuỳ chọn
(guest mode), giao diện tối/sáng, và **chơi online nhiều người** cho các
game đối kháng.

👉 Xem **[SETUP.md](./SETUP.md)** để cài đặt & chạy dự án từ đầu.
👉 Xem **[SETUP_MULTIPLAYER.md](./SETUP_MULTIPLAYER.md)** để bật tính năng chơi online.
👉 Xem **[ONLINE_MULTIPLAYER_PLAN.md](./ONLINE_MULTIPLAYER_PLAN.md)** để hiểu kiến trúc online.
👉 Xem **[PROGRESS.md](./PROGRESS.md)** để biết trạng thái hoàn thiện hiện tại.

## Game hiện có

- 🧩 **Sudoku** — 3 độ khó, đề luôn có lời giải duy nhất, hint thông minh.
- ✖️⭕ **Caro** — 15x15, chơi với máy (3 độ khó) / 2 người cùng máy / **online**.
- ♟️ **Cờ vua** — chơi với máy (Stockfish) / 2 người cùng máy / **online**.
- 🀄 **Cờ tướng** — 2 người cùng máy / **online**.
- 💣 **Dò mìn** — 3 độ khó, luật "mở đầu tiên luôn an toàn".
- 🃏 **Solitaire** (Klondike).
- 🔢 **Đoán số** — kiểu Bulls and Cows, hint suy luận logic.

## Tính năng nền tảng

- 💡 Hint thông minh cho từng game, giải thích lý do bằng tiếng Việt.
- 🌐 **Chơi online**: tạo phòng/nhập mã, link mời, chat (chữ + emoji),
  1 phòng chơi được nhiều ván (rematch), báo trạng thái mất kết nối.
- 📴 PWA: cài vào máy, chơi được khi mất mạng, tự đồng bộ khi có mạng lại.
- 👤 Đăng nhập tuỳ chọn qua Supabase — guest và user đăng nhập đều dùng được mọi tính năng, kể cả tạo phòng online.
- 🌗 Giao diện tối/sáng, responsive cho cả desktop và mobile.

## Công nghệ

Next.js 16 · TypeScript · Tailwind CSS v4 · Zustand · Framer Motion ·
Supabase (Auth + Postgres + **Realtime**) · IndexedDB (`idb`) cho lưu trữ
offline · Vitest · chess.js.

## Lệnh nhanh

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # build production
npm run test     # chạy toàn bộ unit test (84 test)
npm run lint     # kiểm tra lint
```

Chi tiết đầy đủ (Supabase, Docker, deploy Vercel...) xem trong `SETUP.md`.
Để bật tính năng chơi online, xem thêm `SETUP_MULTIPLAYER.md`.

## 📜 Bản quyền & Mã nguồn Mở (Open Source License)

GameHub là một dự án **Mã nguồn Mở (Open Source)** được phát hành dưới giấy phép [MIT License](./LICENSE).

### ⚠️ Quy định về việc tái sử dụng / Fork mã nguồn:
- **Tự do học tập & phát triển**: Bạn hoàn toàn có thể tham khảo, học tập, fork, chỉnh sửa hoặc đóng góp tính năng cho dự án.
- **Giữ thông tin tác giả (Attribution Requirement)**: Khi tái sử dụng, tham khảo hoặc fork dự án này (dù là toàn bộ hay một phần mã nguồn), bạn **Giữ lại thông tin tác giả ban đầu** (Copyright notice / Author credit) và liên kết trỏ về repository gốc. Không được phép xóa hoặc giả mạo thông tin quyền tác giả.

## 🔒 Điều khoản & Chính sách
- **[Chính sách bảo mật (Privacy Policy)](/privacy)**: Cam kết bảo vệ dữ liệu người dùng & quyền riêng tư.
- **[Điều khoản sử dụng (Terms of Service)](/terms)**: Quy định chung khi trải nghiệm ứng dụng & sử dụng mã nguồn.

