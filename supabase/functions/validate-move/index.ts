// Supabase Edge Function — validate-move (tham khảo cho Caro)
//
// ĐÂY LÀ CODE THAM KHẢO CHO NÂNG CẤP TUỲ CHỌN (v2), CHƯA ĐƯỢC NỐI VÀO
// CLIENT MẶC ĐỊNH. Xem supabase/functions/validate-move/README.md để biết
// đầy đủ bối cảnh, lý do, và các bước cần làm nếu bạn muốn triển khai.
//
// Mục đích: nếu bạn muốn nâng cấp từ "client tự validate lẫn nhau" (cách
// đang dùng, đủ tốt cho v1) lên "server là nguồn sự thật duy nhất", đây
// là 1 ví dụ đầy đủ cho game Caro — client sẽ gọi function này thay vì
// tự ghi thẳng vào bảng `rooms`, function tự validate nước đi bằng đúng
// logic engine (port lại từ `src/games/caro/engine/board.ts`), rồi mới
// ghi vào DB bằng service role key (có quyền bỏ qua RLS) và trả kết quả.
//
// Chạy thử cục bộ (cần Supabase CLI): `supabase functions serve validate-move`
// Deploy: `supabase functions deploy validate-move`

import { createClient } from "npm:@supabase/supabase-js@2";

const SIZE = 15;
const WIN_LENGTH = 5;

type CellValue = 0 | 1 | 2;
type Board = CellValue[];

function createEmptyBoard(): Board {
  return new Array(SIZE * SIZE).fill(0) as Board;
}

function rowOf(index: number) {
  return Math.floor(index / SIZE);
}
function colOf(index: number) {
  return index % SIZE;
}
function indexOf(row: number, col: number) {
  return row * SIZE + col;
}
function isInBounds(row: number, col: number) {
  return row >= 0 && row < SIZE && col >= 0 && col < SIZE;
}

const DIRECTIONS: [number, number][] = [
  [0, 1],
  [1, 0],
  [1, 1],
  [1, -1],
];

function checkWin(board: Board, lastMoveIndex: number): { winner: 1 | 2 } | null {
  const player = board[lastMoveIndex];
  if (player === 0) return null;
  const row = rowOf(lastMoveIndex);
  const col = colOf(lastMoveIndex);

  for (const [dr, dc] of DIRECTIONS) {
    let length = 1;
    let r = row + dr;
    let c = col + dc;
    while (isInBounds(r, c) && board[indexOf(r, c)] === player) {
      length++;
      r += dr;
      c += dc;
    }
    r = row - dr;
    c = col - dc;
    while (isInBounds(r, c) && board[indexOf(r, c)] === player) {
      length++;
      r -= dr;
      c -= dc;
    }
    if (length >= WIN_LENGTH) return { winner: player as 1 | 2 };
  }
  return null;
}

/**
 * Replay toàn bộ movesHistory từ đầu để xác nhận tính hợp lệ — cùng kỹ
 * thuật với `syncRemoteBoard` phía client (`src/games/caro/store.ts`),
 * chỉ khác là chạy phía server nên không thể bị client giả mạo.
 */
function validateMovesHistory(movesHistory: number[]): { valid: boolean; board: Board; winner: 1 | 2 | null } {
  let board = createEmptyBoard();
  let player: 1 | 2 = 1;
  let winner: 1 | 2 | null = null;

  for (const idx of movesHistory) {
    if (typeof idx !== "number" || idx < 0 || idx >= board.length || board[idx] !== 0) {
      return { valid: false, board, winner: null };
    }
    board = [...board];
    board[idx] = player;
    const result = checkWin(board, idx);
    if (result) winner = result.winner;
    player = player === 1 ? 2 : 1;
  }

  return { valid: true, board, winner };
}

Deno.serve(async (req: Request) => {
  try {
    const { roomId, movesHistory } = await req.json();

    if (!roomId || !Array.isArray(movesHistory)) {
      return new Response(JSON.stringify({ error: "Thiếu roomId hoặc movesHistory không hợp lệ." }), { status: 400 });
    }

    const { valid, winner } = validateMovesHistory(movesHistory);
    if (!valid) {
      return new Response(JSON.stringify({ error: "Chuỗi nước đi không hợp lệ." }), { status: 422 });
    }

    // Dùng service role key (chỉ tồn tại trong môi trường Edge Function,
    // KHÔNG BAO GIỜ lộ ra client) để ghi đè, bỏ qua RLS.
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { error } = await supabase
      .from("rooms")
      .update({ game_state: { movesHistory }, updated_at: new Date().toISOString() })
      .eq("id", roomId);

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }

    return new Response(JSON.stringify({ ok: true, winner }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 });
  }
});
