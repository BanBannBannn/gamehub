# SETUP — Hướng dẫn cài đặt GameHub từ A-Z

## 1. Yêu cầu hệ thống

- Node.js **20+** (khuyến nghị dùng bản LTS mới nhất)
- npm 10+ (đi kèm Node.js)
- (Tuỳ chọn) Docker + Docker Compose nếu muốn chạy bằng container
- Một project Supabase miễn phí tại https://supabase.com nếu muốn bật đăng nhập/đồng bộ

> Không có Supabase vẫn chạy được bình thường — app sẽ tự chuyển sang
> **chế độ khách (guest-only)**: chơi và lưu tiến trình ngay trên trình
> duyệt, không đăng nhập/đồng bộ cloud.

---

## 2. Cài đặt & chạy local (không cần Docker)

```bash
# 1. Cài dependencies
npm install

# 2. Tạo file .env từ mẫu
cp .env.example .env
# Mở .env và điền NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY
# (xem mục 4 bên dưới nếu chưa có project Supabase)

# 3. Chạy dev server
npm run dev
```

Mở http://localhost:3000 để xem kết quả.

---

## 3. Chạy bằng Docker

```bash
# Đảm bảo đã tạo file .env (như bước 2.2 ở trên) trước khi build,
# vì các biến NEXT_PUBLIC_* cần có mặt lúc BUILD (không chỉ lúc chạy).
docker compose up --build
```

App sẽ chạy tại http://localhost:3000. Dừng bằng `Ctrl+C` hoặc `docker compose down`.

---

## 4. Tạo project Supabase (để bật đăng nhập + đồng bộ)

1. Vào https://supabase.com → **New project**. Đặt tên, chọn khu vực gần bạn (Singapore là gần Việt Nam nhất).
2. Sau khi project khởi tạo xong, vào **Project Settings → API**.
   - Copy **Project URL** → dán vào `NEXT_PUBLIC_SUPABASE_URL` trong file `.env`.
   - Copy **anon public key** → dán vào `NEXT_PUBLIC_SUPABASE_ANON_KEY` trong file `.env`.
3. Vào **SQL Editor** trên Supabase, mở file `supabase/migrations/0001_init.sql` trong project này,
   copy toàn bộ nội dung, dán vào SQL Editor và **Run**. Việc này sẽ tạo:
   - Bảng `profiles` (hồ sơ người dùng, tự tạo khi có người đăng ký).
   - Bảng `game_sessions` (lịch sử các ván chơi).
   - Row Level Security (RLS) đảm bảo mỗi người chỉ đọc/ghi được dữ liệu của chính mình.
4. (Tuỳ chọn) Vào **Authentication → Providers** nếu muốn bật thêm đăng nhập Google/OAuth.
5. Khởi động lại `npm run dev` (hoặc build lại Docker image) sau khi cập nhật `.env`.

---

## 5. Build production (không dùng Docker)

```bash
npm run build
npm run start
```

> Lưu ý: dự án dùng `output: "standalone"` trong `next.config.ts` để tối ưu
> cho Docker. Nếu chạy `npm run start` bạn sẽ thấy 1 cảnh báo vô hại về
> việc này — vẫn hoạt động bình thường cho mục đích chạy thử local.
> Để chạy đúng bản standalone (giống hệt môi trường Docker), dùng:
>
> ```bash
> npm run build
> cp -r public .next/standalone/public
> cp -r .next/static .next/standalone/.next/static
> node .next/standalone/server.js
> ```

---

## 6. Deploy lên Vercel

1. Đẩy code lên GitHub.
2. Vào https://vercel.com/new, import repo.
3. Ở bước cấu hình, thêm 2 biến môi trường (Environment Variables):
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Deploy — Vercel tự nhận diện Next.js, không cần cấu hình gì thêm.
   (Không cần dùng Dockerfile khi deploy trên Vercel; Dockerfile chỉ dùng
   khi bạn muốn tự host bằng container ở nơi khác.)

---

## 7. Kiểm thử

```bash
npm run test     # unit test cho engine Sudoku (generator/solver/hint)
npm run lint     # kiểm tra ESLint
```

### Kiểm tra PWA / offline thủ công

1. `npm run build && npm run start` (service worker chỉ đăng ký ở production).
2. Mở http://localhost:3000 bằng Chrome.
3. Mở DevTools → tab **Application** → **Service Workers**, xác nhận đã "activated".
4. Vào tab **Network**, chọn **Offline**, rồi reload trang → trang chủ và
   `/games/sudoku` vẫn load được, chơi được (tiến trình lưu local).
5. Trên điện thoại: mở trang bằng Chrome/Safari → menu trình duyệt sẽ có
   tuỳ chọn **"Thêm vào màn hình chính" / "Add to Home Screen"**.

---

## 8. Cấu trúc thư mục chính

```
src/
  app/                # Routes (Next.js App Router)
  components/         # UI dùng chung (theme, header, tooltip, landing...)
  games/sudoku/        # Toàn bộ logic + UI riêng cho game Sudoku
    engine/            # Logic thuần (generator, solver, validator, hint) + test
    components/        # Board, Cell, NumberPad, Hud, WinModal...
    store.ts           # Zustand store quản lý state ván chơi
  lib/
    supabase/          # Supabase client (browser + server)
    offline/           # IndexedDB (lưu tiến trình) + đồng bộ khi online
supabase/migrations/    # SQL schema
```

### Thêm game mới sau này

1. Tạo thư mục `src/games/<ten-game>/` với `engine/` + `components/` riêng.
2. Tạo route `src/app/games/<ten-game>/page.tsx`.
3. Thêm 1 `GameCard` mới vào `src/app/page.tsx` (bỏ `comingSoon`).
4. Bảng `game_sessions` đã có sẵn cột `game_slug` dùng chung — không cần đổi schema.

---

## 9. Sự cố thường gặp

- **Lỗi tải font Google lúc build**: dự án đã cố tình dùng system font
  stack (không gọi `next/font/google`) để build luôn thành công kể cả khi
  mạng bị hạn chế/chặn `fonts.googleapis.com`.
- **Không đăng nhập được**: kiểm tra lại `.env` đã điền đúng
  `NEXT_PUBLIC_SUPABASE_URL`/`NEXT_PUBLIC_SUPABASE_ANON_KEY` và đã chạy
  migration SQL ở mục 4 chưa.
- **Docker build lỗi thiếu biến môi trường**: đảm bảo đã tạo `.env` ở thư
  mục gốc trước khi `docker compose up --build` (Compose tự đọc `.env`).
