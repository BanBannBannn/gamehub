# 🌐 KẾ HOẠCH — Thêm chế độ chơi Online nhiều người cho GameHub (bản đã chốt)

> Đây là bản cập nhật sau khi đã chốt các quyết định ở mục 9 của bản kế
> hoạch trước. Vẫn là tài liệu thiết kế — **chưa code**. File này thay
> thế hoàn toàn bản trước đó.

## Tóm tắt các quyết định đã chốt

| Vấn đề | Quyết định |
|---|---|
| Công nghệ realtime | **Supabase Realtime** (Broadcast + Presence + Postgres) |
| Số người/phòng | **Tuỳ từng game** (cấu hình sẵn theo `game_slug`, không cố định 2) |
| Mã phòng / link mời | **Cả 2, đơn giản** — 1 mã ngắn để gõ tay + 1 link để copy/chia sẻ, mở link là vào thẳng phòng |
| Chat | Chữ + emoji đơn giản, **không lưu DB** (ephemeral qua Broadcast) |
| Ai được tạo phòng | **Guest và user đều tạo được**, đúng tinh thần "chơi ngay không cần đăng nhập" |
| Phòng có sống lại nhiều ván không | **Có** — 1 phòng chơi được nhiều ván liên tiếp (rematch), không phải tạo phòng mới mỗi ván |
| Chống DB phình to vì tạo phòng liên tục | Giới hạn theo mục 3 bên dưới (dọn phòng tự động nhiều tầng + giới hạn 1 phòng đang mở/người + không lưu chat) |
| Nơi tạo phòng | Vẫn tạo từ trong trang của từng game (không làm sảnh chung riêng cho v1) — xem lý do mục 6 |

---

## 1. Vòng đời 1 phòng — hỗ trợ nhiều ván (rounds) trong cùng 1 phòng

Tách rõ khái niệm **"phòng" (persistent, sống suốt buổi chơi)** khỏi
**"ván" (round, 1 lượt thắng/thua/hoà cụ thể)**:

```
waiting        → đang chờ đủ người + mọi người bấm "Sẵn sàng"
   ↓ (đủ người + tất cả sẵn sàng)
playing        → đang chơi 1 ván (round_number hiện tại)
   ↓ (có người thắng/thua/hoà)
round_finished → hiện màn kết quả ván + tỉ số tích luỹ, chờ vote "Chơi lại"
   ↓ (tất cả bấm "Chơi lại")          ↓ (có người rời phòng)
playing (round_number + 1)         closed
```

- `rooms.round_number`: tăng dần mỗi ván mới trong cùng phòng.
- `rooms.scoreboard` (jsonb, ví dụ `{"0": 3, "1": 2}`): đếm số ván thắng
  theo từng `slot`, hiển thị dạng "Bạn 3 – 2 Đối thủ" xuyên suốt phiên
  chơi trong phòng — tạo động lực chơi tiếp nhiều ván mà không cần tạo
  phòng mới, đúng ý "1 phòng chơi nhiều trận".
- Khi bắt đầu ván mới: chỉ reset `game_state` về trạng thái khởi tạo của
  game đó (dùng lại hàm khởi tạo sẵn có trong engine, ví dụ
  `createEmptyBoard()` của Caro) — không tạo row `rooms` mới, không tạo
  mã phòng mới.
- `closed`: khi 1 người chủ động rời hẳn phòng (không phải mất mạng tạm
  thời — Presence phân biệt được 2 trường hợp này), hoặc khi dọn tự động
  (mục 3).

---

## 2. Cập nhật schema (`0002_multiplayer.sql`)

```sql
create table if not exists public.rooms (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  game_slug text not null,
  status text not null default 'waiting',  -- 'waiting' | 'playing' | 'round_finished' | 'closed'
  max_players int not null,                -- lấy từ cấu hình mặc định của game lúc tạo phòng, xem mục 4
  host_user_id uuid references public.profiles(id),
  host_guest_id text,
  round_number int not null default 1,
  scoreboard jsonb not null default '{}',  -- { "<slot>": <số ván thắng> }
  game_state jsonb,
  settings jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.room_players (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.rooms(id) on delete cascade,
  slot int not null,
  user_id uuid references public.profiles(id),
  guest_id text,
  display_name text not null,
  is_ready boolean not null default false,
  is_connected boolean not null default true,
  joined_at timestamptz not null default now(),
  unique (room_id, slot),
  check (user_id is not null or guest_id is not null)
);

alter table public.rooms enable row level security;
alter table public.room_players enable row level security;

create policy "Ai cũng đọc được thông tin phòng" on public.rooms for select using (true);
create policy "Ai cũng tạo được phòng" on public.rooms for insert with check (true);
create policy "Người trong phòng có thể cập nhật phòng" on public.rooms for update using (true);

create policy "Ai cũng đọc được danh sách người chơi trong phòng" on public.room_players for select using (true);
create policy "Ai cũng có thể tham gia phòng" on public.room_players for insert with check (true);
create policy "Người chơi có thể cập nhật trạng thái của chính mình" on public.room_players for update using (true);

-- Chỉ số hoá để tra cứu theo mã phòng và dọn dẹp theo thời gian cho nhanh.
create index if not exists rooms_code_idx on public.rooms (code);
create index if not exists rooms_status_updated_idx on public.rooms (status, updated_at);
```

> **Chat không có bảng riêng** — cố tình, xem mục 3 (đây là quyết định
> kép: vừa "đơn giản" như bạn yêu cầu, vừa là cách giảm số dòng ghi vào
> DB nhiều nhất, vì chat thường là thứ sinh ra nhiều dữ liệu nhất trong 1
> phiên chơi nếu lưu lại).

---

## 3. Chống DB phình to — giới hạn nhiều tầng

Tạo phòng bình thường (đúng nhu cầu thật) **không phải vấn đề** — Postgres
xử lý hàng triệu dòng dễ dàng. Vấn đề thật sự là **rác tồn đọng** (phòng
tạo ra rồi bỏ dở, không ai dọn) và **spam** (1 người tạo phòng liên tục
không mục đích). Xử lý bằng 3 lớp:

### 3.1. Giới hạn 1 phòng đang mở / mỗi người (chống spam + tận dụng "nhiều ván")
Trước khi `createRoom()`, kiểm tra: identity hiện tại (user_id hoặc
guest_id) **đã có phòng nào đang ở trạng thái `waiting`/`playing`/
`round_finished` mà họ là host chưa** → nếu có, **trả về phòng đó luôn**
thay vì tạo phòng mới. Vừa chặn spam tự nhiên, vừa khớp đúng tinh thần
"1 phòng chơi nhiều ván" (người chơi có xu hướng quay lại đúng phòng cũ
thay vì tạo phòng mới liên tục).

### 3.2. Dọn tự động theo tầng (cron `cleanup_stale_rooms`, chạy mỗi 5-10 phút)
```sql
create or replace function public.cleanup_stale_rooms() returns void as $$
begin
  -- Phòng chờ quá lâu không đủ người / không ai sẵn sàng.
  update public.rooms set status = 'closed'
  where status = 'waiting' and updated_at < now() - interval '15 minutes';

  -- Phòng mà TẤT CẢ người chơi đều mất kết nối (không ai còn trong tab) khá lâu.
  update public.rooms r set status = 'closed'
  where r.status in ('waiting', 'playing', 'round_finished')
    and not exists (
      select 1 from public.room_players p
      where p.room_id = r.id and p.is_connected = true
    )
    and r.updated_at < now() - interval '5 minutes';

  -- Phòng đã đóng từ lâu → xoá hẳn khỏi DB.
  delete from public.rooms where status = 'closed' and updated_at < now() - interval '2 hours';
end;
$$ language plpgsql security definer set search_path = public;
```
Đăng ký chạy định kỳ qua **Supabase Cron** (pg_cron có sẵn trên Supabase,
bật trong Dashboard → Database → Cron Jobs, không cần server riêng).

### 3.3. Không lưu lịch sử chat, không lưu log từng nước đi
Đã quyết định ở mục "Chat" — chỉ Broadcast, không ghi bảng. Nước đi cũng
chỉ ghi đè `game_state` (1 cột, không phải 1 dòng mới mỗi nước đi).

→ Kết quả: số dòng trong `rooms`/`room_players` tại bất kỳ thời điểm nào
tỉ lệ với **số phòng đang thực sự hoạt động**, không tỉ lệ với tổng số
ván đã từng chơi từ trước tới giờ — đây chính là điều cần để tránh phình DB.

---

## 4. Số người chơi tuỳ game — cấu hình mặc định

```ts
// src/lib/multiplayer/gameConfig.ts
export const MULTIPLAYER_CONFIG: Record<string, { minPlayers: number; maxPlayers: number }> = {
  caro: { minPlayers: 2, maxPlayers: 2 },
  chess: { minPlayers: 2, maxPlayers: 2 },
  xiangqi: { minPlayers: 2, maxPlayers: 2 },
  // Game nhiều người hơn sau này chỉ cần thêm 1 dòng ở đây, ví dụ:
  // caro_battle_royale: { minPlayers: 2, maxPlayers: 4 },
};
```
`createRoom(gameSlug)` đọc `maxPlayers` từ đây để set cột `rooms.max_players`
— không hard-code số 2 ở bất kỳ đâu trong code phòng/chờ, để game nhiều
người hơn sau này (nếu có) cắm vào được ngay mà không phải sửa lại phần
lobby/waiting-room dùng chung.

---

## 5. Mã phòng + link mời (đơn giản, gộp làm 1 thao tác)

- Mã phòng: 6 ký tự (bỏ ký tự dễ nhầm `0/O`, `1/I`), ví dụ `7K9XPB`.
- Link mời: `https://<domain>/games/<slug>?room=<code>` — khi 1 người mở
  link này, tự động điền sẵn mã phòng và bấm giúp "Tham gia" (nếu chưa
  từng ở trong phòng đó), không bắt gõ tay lại mã.
- UI chỉ cần **1 nút chính**: "Sao chép link mời" (copy cả link, dùng
  được ngay để dán vào Messenger/Zalo...). Mã phòng dạng chữ vẫn hiển thị
  bên dưới cho trường hợp đọc mã qua voice call/nói miệng.

---

## 6. Vì sao vẫn tạo phòng từ trong trang từng game (không làm sảnh chung)

Giữ đúng kiến trúc hiện tại — mỗi game có route + màn chọn chế độ riêng
(`/games/caro` có `ModeAndDifficultyPicker`, v.v.) — thêm lựa chọn
**"Chơi online"** vào đúng màn đó, dẫn tới lobby **của game đó**
(`game_slug` đã cố định theo trang đang đứng, không cần chọn lại).

Lý do chọn cách này thay vì làm 1 trang `/online` tổng hợp cho phép chọn
game rồi mới tạo phòng:
- Đơn giản hơn nhiều — không phải xây thêm 1 hệ thống điều hướng riêng.
- Nhất quán với toàn bộ phần còn lại của site (vào đúng game muốn chơi rồi mới chọn chế độ).
- Không mất gì về sau — vì `game_slug` đã có sẵn trong bảng `rooms`, một
  trang "sảnh chung" (browse phòng đang mở theo mọi game) hoàn toàn có
  thể thêm sau này như 1 tính năng độc lập, không phải đập đi làm lại gì.

---

## 7. Chat — chữ + emoji đơn giản

- 1 ô nhập text bình thường (hỗ trợ gõ emoji qua bàn phím emoji có sẵn
  của hệ điều hành/trình duyệt — không cần build thêm emoji picker riêng).
- Kèm 1 hàng **6-8 emoji nhanh** (👍 😂 😮 😢 😡 ❤️...) bấm 1 phát gửi
  luôn, tiện cho lúc đang chơi không rảnh tay gõ chữ.
- Gửi qua Broadcast (`event: "chat"`), hiện trong khung chat dạng danh
  sách trượt, **không lưu DB**, mất khi rời phòng — đúng tinh thần "đơn giản".
- Giới hạn độ dài tin nhắn (ví dụ 200 ký tự) + giới hạn tần suất gửi
  đơn giản phía client (ví dụ tối đa 1 tin/giây) để tránh spam làm rối
  khung chat, không cần phức tạp hơn cho v1.

---

## 8. Kiến trúc module & tích hợp từng game — giữ nguyên như bản trước

Không đổi so với kế hoạch trước, chỉ tóm tắt lại vì các phần này không
bị ảnh hưởng bởi các quyết định mới chốt:

- `src/lib/multiplayer/` gồm `guest.ts`, `rooms.ts`, `useRoomChannel.ts`,
  `roomCode.ts`, `gameConfig.ts` (mới thêm ở mục 4), `types.ts`.
- Mỗi game (`caro`/`chess`/`xiangqi`) thêm `mode: "online"` vào type có
  sẵn, validate nước đi bằng chính engine cũ khi cả gửi lẫn nhận, không
  viết lại logic game.
- Reconnect: đọc lại `game_state` từ DB khi vào lại phòng.
- Giới hạn gian lận: client tự validate 2 chiều cho v1, server-side
  validate qua Edge Function là hướng nâng cấp sau, không bắt buộc.

---

## 9. Các bước triển khai đề xuất

1. **Giai đoạn 1**: migration `0002_multiplayer.sql` (đã cập nhật ở mục
   2) + cron `cleanup_stale_rooms` + `src/lib/multiplayer/*` (bao gồm
   `gameConfig.ts` mới) + UI lobby/waiting-room dùng chung (tạo phòng
   1-nút-copy-link, nhập mã, danh sách người chơi realtime, nút Sẵn sàng).
2. **Giai đoạn 2**: tích hợp Caro trọn vẹn — bao gồm **cả luồng nhiều
   ván trong 1 phòng** (màn kết quả ván + tỉ số tích luỹ + nút Chơi lại),
   không chỉ làm 1 ván rồi thôi. Tự test bằng 2 tab trình duyệt.
3. **Giai đoạn 3**: Chess & Xiangqi theo đúng pattern đã chạy ổn ở Caro.
4. **Giai đoạn 4 (sau, không gấp)**: server-side move validation, sảnh
   chung liệt kê phòng đang mở, lưu lịch sử ván đấu nếu sau này thật sự cần.

---

*Không còn câu hỏi mở nào cần chốt thêm — sẵn sàng tách thành spec chi
tiết từng giai đoạn hoặc bắt đầu code theo đúng thứ tự mục 9 khi bạn báo.*
