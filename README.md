# 🎮 GameHub

Nền tảng web game giải trí trí tuệ — bắt đầu với **Sudoku**, xây trên
Next.js 16 (App Router) + Supabase. Hỗ trợ PWA (cài đặt được, chơi offline),
đăng nhập tuỳ chọn (guest mode), giao diện tối/sáng.

👉 Xem **[SETUP.md](./SETUP.md)** để cài đặt & chạy dự án từ đầu.
👉 Xem **[PROGRESS.md](./PROGRESS.md)** để biết trạng thái hoàn thiện hiện tại.

## Tính năng

- 🧩 Sudoku 3 độ khó (Dễ/Trung bình/Khó), đề luôn có **lời giải duy nhất**.
- 💡 Hệ thống hint thông minh, giải thích lý do bằng tiếng Việt.
- ✏️ Ghi chú (pencil marks), highlight hàng/cột/khối, phát hiện xung đột.
- ↩️ Undo/Redo, đếm thời gian, đếm số lần dùng hint.
- 📴 PWA: cài vào máy, **chơi được khi mất mạng**, tự đồng bộ khi có mạng lại.
- 👤 Đăng nhập tuỳ chọn qua Supabase — không đăng nhập vẫn chơi & lưu tiến trình local bình thường.
- 🌗 Giao diện tối/sáng, responsive cho cả desktop và mobile.

## Công nghệ

Next.js 16 · TypeScript · Tailwind CSS v4 · Zustand · Framer Motion ·
Supabase (Auth + Postgres) · IndexedDB (`idb`) cho lưu trữ offline · Vitest.

## Lệnh nhanh

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # build production
npm run test     # chạy unit test cho engine Sudoku
npm run lint     # kiểm tra lint
```

Chi tiết đầy đủ (Supabase, Docker, deploy Vercel...) xem trong `SETUP.md`.
