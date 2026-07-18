# Edge Function `validate-move` — nâng cấp tuỳ chọn (v2), CHƯA bật mặc định

## Đây là gì

Đây là **code tham khảo** cho hướng nâng cấp "server-authoritative move
validation" đã được nhắc tới trong `ONLINE_MULTIPLAYER_PLAN.md` (mục 7 —
"Lưu ý về gian lận"). Ở phiên bản hiện tại (v1), việc chống gian lận dựa
trên nguyên tắc: **cả 2 client tự validate lẫn nhau** bằng cách replay lại
toàn bộ chuỗi nước đi qua đúng engine của game (`syncRemoteBoard` trong
`src/games/caro/store.ts`, `syncRemoteState` trong `chess`/`xiangqi`). Điều
này đủ để chặn lỗi dữ liệu hỏng và gian lận "ngây thơ", nhưng **không chặn
được** người tự sửa code client để gửi thẳng dữ liệu giả qua Supabase
Realtime/DB.

`index.ts` trong thư mục này là **ví dụ đầy đủ cho game Caro** — validate
nước đi bằng logic engine y hệt phía client, nhưng chạy trên server
(Supabase Edge Function, dùng Deno) nên không thể bị client can thiệp.

## QUAN TRỌNG — code này chưa được kết nối vào client

**Client hiện tại vẫn ghi thẳng vào bảng `rooms` như trước** (qua
`updateRoomGameState` trong `src/lib/multiplayer/rooms.ts`), **không gọi**
function này. Lý do:

1. Đây là môi trường sandbox, **không có quyền truy cập mạng tới Supabase
   thật** để deploy và test Edge Function này — không thể xác nhận nó
   chạy đúng trên hạ tầng thật của bạn.
2. Đổi client sang gọi Edge Function thay vì ghi thẳng DB là 1 thay đổi
   kiến trúc có rủi ro (cần đổi RLS, cần service role key, cần xử lý lỗi
   mạng/timeout khác đi) — không nên áp dụng vào luồng chính đang hoạt
   động tốt (đã test kỹ bằng unit test) mà chưa kiểm chứng được thật.

## Nếu bạn muốn tự triển khai

1. Cài Supabase CLI, `supabase login`, `supabase link` vào project của bạn.
2. Deploy: `supabase functions deploy validate-move`
3. Trong `src/lib/multiplayer/rooms.ts`, sửa `updateRoomGameState` (chỉ
   cho Caro trước, làm thử nghiệm) để gọi
   `supabase.functions.invoke("validate-move", { body: { roomId, movesHistory } })`
   thay vì `.update()` trực tiếp vào bảng `rooms`.
4. Đổi RLS của bảng `rooms`: bỏ policy "Ai cũng có thể cập nhật phòng"
   cho cột `game_state` (siết lại chỉ cho phép service role ghi cột này
   — có thể cần tách `game_state` ra 1 bảng riêng với RLS ngặt hơn, hoặc
   dùng Postgres column-level security).
5. Test kỹ bằng 2 trình duyệt/2 tài khoản thật trước khi coi là hoàn
   thành — đặc biệt test trường hợp mạng chậm/mất kết nối giữa lúc gọi
   function.
6. Làm tương tự cho Chess (dùng `chess.js` qua `npm:chess.js` import
   trong Deno — Supabase Edge Functions hỗ trợ npm specifier) và Xiangqi
   (port lại `src/games/xiangqi/engine/logic.ts`, chủ yếu là hàm
   `getLegalMoves`).

## Vì sao vẫn đáng để có sẵn code này dù chưa dùng

- Kiến trúc hiện tại (client tự validate qua `syncRemoteBoard`/
  `syncRemoteState`) đã tách rời rõ ràng "validate" khỏi "transport" —
  chuyển sang server-side validation sau này KHÔNG cần viết lại UI hay
  store, chỉ cần đổi phần "ghi dữ liệu đi đâu".
- File này là điểm khởi đầu đã hoạt động về mặt logic (dùng đúng thuật
  toán `checkWin` đã có unit test ở phía client) — không phải viết từ đầu.
