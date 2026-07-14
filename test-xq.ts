import { createInitialBoard, getLegalMoves, isCheckmateOrStalemate } from "./src/games/xiangqi/engine/logic";

const board = createInitialBoard();
const redMoves = getLegalMoves(board, 4, 6); // Red Pawn at (4,6) moving to (4,5)
console.log("Red moves for Pawn at 4,6:", redMoves);

const newBoard = board.map(r => [...r]);
newBoard[5][4] = newBoard[6][4];
newBoard[6][4] = null;

console.log("Checkmate/Stalemate check for Black:");
const isOver = isCheckmateOrStalemate(newBoard, "b");
console.log("Is over:", isOver);
