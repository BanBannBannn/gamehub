import { BoardState, Color, Piece, PieceType, Position } from "./types";

let pieceIdCounter = 0;

function createPiece(char: string): Piece | null {
  if (char === ".") return null;
  const isRed = char === char.toUpperCase();
  const color: Color = isRed ? "r" : "b";
  const typeStr = char.toLowerCase();
  
  let type: PieceType = "p";
  if (["k", "a", "e", "h", "r", "c", "p"].includes(typeStr)) {
    type = typeStr as PieceType;
  }

  return {
    id: `xq_${pieceIdCounter++}`,
    color,
    type,
  };
}

export function createInitialBoard(): BoardState {
  pieceIdCounter = 0;
  const startFen = [
    "rheakaehr",
    ".........",
    ".c.....c.",
    "p.p.p.p.p",
    ".........",
    ".........",
    "P.P.P.P.P",
    ".C.....C.",
    ".........",
    "RHEAKAEHR"
  ];

  const board: BoardState = [];
  for (let y = 0; y < 10; y++) {
    const row: (Piece | null)[] = [];
    for (let x = 0; x < 9; x++) {
      row.push(createPiece(startFen[y][x]));
    }
    board.push(row);
  }
  return board;
}

// Check if position is inside the board
export function isValidPos(x: number, y: number): boolean {
  return x >= 0 && x <= 8 && y >= 0 && y <= 9;
}

// Check if position is inside the 3x3 palace
export function isInsidePalace(x: number, y: number, color: Color): boolean {
  if (x < 3 || x > 5) return false;
  if (color === "b") {
    return y >= 0 && y <= 2;
  } else {
    return y >= 7 && y <= 9;
  }
}

// Generate all pseudo-legal moves for a piece at (x, y)
export function getPseudoLegalMoves(board: BoardState, x: number, y: number): Position[] {
  const piece = board[y][x];
  if (!piece) return [];

  const moves: Position[] = [];
  const color = piece.color;
  const dir = color === "r" ? -1 : 1; // Red moves up (y decreases), Black moves down (y increases)

  const addIfValid = (nx: number, ny: number) => {
    if (!isValidPos(nx, ny)) return false;
    const target = board[ny][nx];
    if (!target || target.color !== color) {
      moves.push({ x: nx, y: ny });
    }
    return !target; // Return true if empty (so sliding pieces can continue)
  };

  switch (piece.type) {
    case "k": // General (Tướng)
      [[-1, 0], [1, 0], [0, -1], [0, 1]].forEach(([dx, dy]) => {
        const nx = x + dx, ny = y + dy;
        if (isInsidePalace(nx, ny, color)) {
          addIfValid(nx, ny);
        }
      });
      break;

    case "a": // Advisor (Sĩ)
      [[-1, -1], [-1, 1], [1, -1], [1, 1]].forEach(([dx, dy]) => {
        const nx = x + dx, ny = y + dy;
        if (isInsidePalace(nx, ny, color)) {
          addIfValid(nx, ny);
        }
      });
      break;

    case "e": // Elephant (Tượng)
      [[-2, -2], [-2, 2], [2, -2], [2, 2]].forEach(([dx, dy]) => {
        const nx = x + dx, ny = y + dy;
        // Check river crossing (cannot cross)
        if (color === "r" && ny < 5) return;
        if (color === "b" && ny > 4) return;
        
        // Check elephant eye (cản tượng)
        const eyeX = x + dx / 2;
        const eyeY = y + dy / 2;
        
        if (isValidPos(nx, ny) && !board[eyeY][eyeX]) {
          addIfValid(nx, ny);
        }
      });
      break;

    case "h": // Horse (Mã)
      [
        [-2, -1], [-2, 1], [2, -1], [2, 1],
        [-1, -2], [1, -2], [-1, 2], [1, 2]
      ].forEach(([dx, dy]) => {
        const nx = x + dx, ny = y + dy;
        // Check horse leg (cản mã)
        const legX = x + (Math.abs(dx) === 2 ? dx / 2 : 0);
        const legY = y + (Math.abs(dy) === 2 ? dy / 2 : 0);
        
        if (isValidPos(nx, ny) && !board[legY][legX]) {
          addIfValid(nx, ny);
        }
      });
      break;

    case "r": // Chariot (Xe)
      [[-1, 0], [1, 0], [0, -1], [0, 1]].forEach(([dx, dy]) => {
        let nx = x + dx, ny = y + dy;
        while (isValidPos(nx, ny)) {
          if (!addIfValid(nx, ny)) break;
          nx += dx; ny += dy;
        }
      });
      break;

    case "c": // Cannon (Pháo)
      [[-1, 0], [1, 0], [0, -1], [0, 1]].forEach(([dx, dy]) => {
        let nx = x + dx, ny = y + dy;
        let jumped = false;
        while (isValidPos(nx, ny)) {
          const target = board[ny][nx];
          if (!jumped) {
            if (!target) {
              moves.push({ x: nx, y: ny });
            } else {
              jumped = true; // Met the mount
            }
          } else {
            if (target) {
              // Found a piece to capture
              if (target.color !== color) {
                moves.push({ x: nx, y: ny });
              }
              break; // Stop sliding after the first piece after jump
            }
          }
          nx += dx; ny += dy;
        }
      });
      break;

    case "p": // Pawn (Tốt)
      // Move forward
      addIfValid(x, y + dir);
      
      // If crossed river, can move horizontally
      const crossed = (color === "r" && y <= 4) || (color === "b" && y >= 5);
      if (crossed) {
        addIfValid(x - 1, y);
        addIfValid(x + 1, y);
      }
      break;
  }

  return moves;
}

// Check "Flying General" rule: Generals cannot face each other directly without pieces in between
export function isFlyingGeneral(board: BoardState): boolean {
  let rKing: Position | null = null;
  let bKing: Position | null = null;

  for (let y = 0; y < 10; y++) {
    for (let x = 3; x <= 5; x++) {
      const p = board[y][x];
      if (p?.type === "k") {
        if (p.color === "r") rKing = { x, y };
        else bKing = { x, y };
      }
    }
  }

  if (rKing && bKing && rKing.x === bKing.x) {
    let piecesBetween = 0;
    const minY = Math.min(rKing.y, bKing.y);
    const maxY = Math.max(rKing.y, bKing.y);
    for (let y = minY + 1; y < maxY; y++) {
      if (board[y][rKing.x]) piecesBetween++;
    }
    if (piecesBetween === 0) return true; // Invalid state
  }

  return false;
}

// Clone board to simulate moves
export function cloneBoard(board: BoardState): BoardState {
  return board.map(row => [...row]);
}

// Get all completely legal moves (filters out moves that leave king in check or cause flying general)
export function getLegalMoves(board: BoardState, x: number, y: number): Position[] {
  const piece = board[y][x];
  if (!piece) return [];
  const color = piece.color;

  const pseudoMoves = getPseudoLegalMoves(board, x, y);
  
  return pseudoMoves.filter(pos => {
    // Simulate move
    const newBoard = cloneBoard(board);
    newBoard[pos.y][pos.x] = newBoard[y][x];
    newBoard[y][x] = null;

    // Check flying general
    if (isFlyingGeneral(newBoard)) return false;

    // Check if my king is under attack
    return !isKingInCheck(newBoard, color);
  });
}

// Check if a specific color's king is in check
export function isKingInCheck(board: BoardState, color: Color): boolean {
  let kingPos: Position | null = null;

  // Find the king
  for (let y = 0; y < 10; y++) {
    for (let x = 3; x <= 5; x++) {
      const p = board[y][x];
      if (p?.type === "k" && p.color === color) {
        kingPos = { x, y };
        break;
      }
    }
    if (kingPos) break;
  }

  if (!kingPos) return false; // Should not happen in a valid game

  const opponentColor = color === "r" ? "b" : "r";

  // Check if any opponent piece can attack the king
  for (let y = 0; y < 10; y++) {
    for (let x = 0; x < 9; x++) {
      const p = board[y][x];
      if (p && p.color === opponentColor) {
        const moves = getPseudoLegalMoves(board, x, y);
        if (moves.some(m => m.x === kingPos!.x && m.y === kingPos!.y)) {
          return true;
        }
      }
    }
  }

  return false;
}

// Check if the game is over (no legal moves for the current color)
export function isCheckmateOrStalemate(board: BoardState, colorToMove: Color): boolean {
  for (let y = 0; y < 10; y++) {
    for (let x = 0; x < 9; x++) {
      const p = board[y][x];
      if (p && p.color === colorToMove) {
        const moves = getLegalMoves(board, x, y);
        if (moves.length > 0) return false;
      }
    }
  }
  return true; // No legal moves = lost
}
