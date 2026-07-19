# SETUP_MULTIPLAYER — Cài đặt tính năng chơi Online

Tính năng chơi online (Caro, Cờ vua, Cờ tướng) dùng **Supabase Realtime**,
xây dựng trên cùng project Supabase bạn đã cấu hình cho phần Auth/lưu tiến
trình (xem `SETUP.md` mục 4 nếu chưa có project). Làm theo các bước sau
**sau khi** đã chạy `0001_init.sql`.

## 1. Chạy migration

Vào **SQL Editor** trên Supabase Dashboard, chạy lần lượt 2 file:

1. `supabase/migrations/0002_multiplayer.sql` — **bắt buộc**, tạo bảng
   `rooms`, `room_players`, RLS, và hàm dọn phòng rác `cleanup_stale_rooms()`.
2. `supabase/migrations/0003_round_history.sql` — **tuỳ chọn**, tạo bảng
   `room_round_history` để lưu lại lịch sử các ván đã hoàn thành. Có thể
   bỏ qua nếu không cần xem lại lịch sử — mọi tính năng chơi online khác
   vẫn hoạt động bình thường không có bảng này.

## 2. Bật Realtime cho 2 bảng (nếu Dashboard không tự bật)

File `0002_multiplayer.sql` đã có sẵn lệnh:
```sql
alter publication supabase_realtime add table public.rooms;
alter publication supabase_realtime add table public.room_players;
```
Nếu vì lý do nào đó lệnh này báo lỗi trên project của bạn (tuỳ phiên bản
Supabase), vào **Database → Replication** trên Dashboard, tìm 2 bảng
`rooms` và `room_players`, bật toggle Realtime cho cả 2.

## 3. (Khuyến nghị) Bật cron dọn phòng rác tự động

Vào **Database → Cron Jobs** (cần extension `pg_cron`, thường có sẵn),
tạo 1 job mới chạy mỗi 10 phút:

```sql
select cron.schedule(
  'cleanup-stale-rooms',
  '*/10 * * * *',
  $$ select public.cleanup_stale_rooms(); $$
);
```

Nếu không bật cron, phòng rác vẫn không ảnh hưởng tới trải nghiệm chơi
(chỉ là sẽ tồn đọng trong DB lâu hơn) — bạn có thể chạy tay
`select public.cleanup_stale_rooms();` bất cứ lúc nào trong SQL Editor.

## 4. Kiểm thử

Vì tính năng này cần 2 người chơi thật (hoặc 2 tab trình duyệt/2 thiết bị
khác nhau), cách kiểm thử đơn giản nhất:

1. `npm run dev`, mở `/games/caro` ở **tab ẩn danh thứ 1** → chọn "Chơi
   online" → "Tạo phòng mới" → copy mã phòng.
2. Mở `/games/caro` ở **tab ẩn danh thứ 2** (hoặc trình duyệt khác) →
   "Chơi online" → "Tham gia phòng" → dán mã.
3. Cả 2 tab bấm "Sẵn sàng" → ván tự bắt đầu.
4. Thử đánh vài nước từ cả 2 phía, thử gửi chat, thử tắt 1 tab để xem
   banner "mất kết nối" ở tab còn lại, thử thắng 1 ván rồi bấm "Chơi lại"
   ở cả 2 tab để xác nhận ván thứ 2 bắt đầu đúng trong cùng phòng (tỉ số
   được cộng dồn).
5. Lặp lại tương tự cho `/games/chess` và `/games/xiangqi`.
6. **Kiểm thử thêm các luồng mới (quan trọng, phức tạp nhất):**
   - Đang chơi, bấm **Cầu hoà** ở tab 1 → xác nhận tab 2 hiện banner "đang
     xin hoà" → bấm **Đồng ý** ở tab 2 → cả 2 tab phải chuyển sang màn
     kết quả với "Hoà!". Thử lại với **Từ chối** → banner biến mất, ván
     tiếp tục bình thường.
   - Đang chơi, bấm **Đầu hàng** ở tab 1 (xác nhận qua modal) → tab 2
     phải ngay lập tức thấy mình thắng.
   - Đang chơi, bấm **Rời phòng** ở tab 1 (xác nhận qua modal) → tab 1
     phải bị đưa về trang chủ (điều hướng cứng, không chỉ đổi màn hình)
     → tab 2 phải thấy mình thắng do đối thủ rời.
   - Sau khi tab 1 rời phòng như trên, mở 1 **tab thứ 3** → "Chơi online"
     → "Tham gia phòng" → dán đúng mã phòng cũ → xác nhận vào được (thay
     thế người vừa rời), cả tab 2 và tab 3 bấm "Sẵn sàng" → ván mới bắt
     đầu bình thường trong đúng phòng đó.
   - **F5 reload** 1 tab đang chơi dở (không rời phòng) → xác nhận URL
     vẫn còn `?room=MÃ`, trang tự động load lại đúng ván đang chơi, không
     bị đẩy về màn hình chọn chế độ.
   - Vào thẳng `/games/caro` (không có `?room=`) → "Chơi online" → "Tạo
     phòng mới" → xác nhận **luôn luôn ra mã phòng mới**, không bị kéo về
     phòng cũ đã tạo trước đó trong cùng phiên.

> Bản thân AI thực hiện task này **không kiểm thử được luồng 2 người
> chơi thật** vì môi trường sandbox không có quyền truy cập mạng tới
> Supabase — chỉ kiểm chứng được: build/lint/type-check sạch, 90 unit
> test pass (bao gồm test validate dữ liệu nhận qua "đồng bộ online" và
> test riêng cho đầu hàng/cầu hoà của cả 3 game), và các route load được
> (200, không crash, kể cả kèm `?room=MÃ`). **Bạn cần tự làm bước kiểm
> thử 2-3 tab ở trên ít nhất 1 lần**, đặc biệt mục 6 (các luồng mới, phức
> tạp, nhiều khả năng còn edge case chưa lường hết) — trước khi coi tính
> năng là hoàn thiện trên môi trường thật của bạn.

## 5. Giới hạn đã biết (ghi rõ, không phải bug ẩn)

- **Chưa có server-side move validation** — xem
  `supabase/functions/validate-move/README.md` để biết hướng nâng cấp
  tuỳ chọn nếu bạn cần mức độ chống gian lận cao hơn.
- **Xiangqi online không tự lật bàn cờ** theo góc nhìn quân Đen (giữ
  nguyên hướng cố định như chế độ 2 người cùng máy trước đó) — người
  chơi quân Đen sẽ thấy bàn cờ "ngược" so với quân Đỏ. Có thể cải thiện
  sau bằng cách thêm logic lật toạ độ x,y khi render + khi xử lý click,
  nhưng chưa làm ở v1 để tránh rủi ro phá vỡ logic click đã hoạt động ổn.
- **Chat không lưu lịch sử**, mất khi rời phòng — đây là quyết định thiết
  kế có chủ đích (xem `ONLINE_MULTIPLAYER_PLAN.md` mục 7), không phải thiếu sót.
- Rời phòng **chủ động** (bấm nút Rời phòng) giờ đã tính là đầu hàng và
  xử thắng ngay cho đối thủ (xem PROGRESS.md đợt 2). Trường hợp còn lại
  chưa xử lý: **đóng tab đột ngột / mất mạng** (không qua nút Rời phòng)
  sẽ để đối thủ chỉ thấy banner "mất kết nối" và phải tự bấm Đầu hàng
  hoặc Rời phòng nếu muốn kết thúc sớm — chưa có cơ chế tự động xử thắng
  sau X giây mất kết nối (đối thủ vẫn có thể chờ, hoặc phòng sẽ tự dọn
  sau ~5-15 phút qua cron nếu không ai còn kết nối).
