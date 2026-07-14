import { openDB, DBSchema, IDBPDatabase } from "idb";

export interface SudokuSaveState {
  gameSlug: "sudoku";
  difficulty: "easy" | "medium" | "hard";
  puzzle: number[];
  solution: number[];
  board: number[];
  notes: number[][]; // pencil marks per cell
  startedAt: number;
  elapsedSeconds: number;
  hintsUsed: number;
  updatedAt: number;
}

export interface CaroSaveState {
  gameSlug: "caro";
  board: number[]; // 0 trống, 1 = X, 2 = O
  currentPlayer: 1 | 2;
  mode: "ai" | "hotseat";
  difficulty: "easy" | "medium" | "hard";
  humanPlayer: 1 | 2;
  movesHistory: number[];
  hintsUsed: number;
  elapsedSeconds: number;
  updatedAt: number;
}

export interface MinesweeperSaveState {
  gameSlug: "minesweeper";
  board: import("@/games/minesweeper/engine/types").Board;
  config: import("@/games/minesweeper/engine/types").BoardConfig;
  difficulty: import("@/games/minesweeper/engine/types").Difficulty;
  status: "idle" | "playing" | "won" | "lost";
  firstClickDone: boolean;
  hintsUsed: number;
  elapsedSeconds: number;
  updatedAt: number;
}

export interface ChessSaveState {
  gameSlug: "chess";
  fen: string;
  pgn: string;
  whiteTime: number;
  blackTime: number;
  status: "idle" | "playing" | "won" | "draw";
  winner: "w" | "b" | null;
  mode: "ai" | "hotseat";
  autoFlip: boolean;
  timeConfig: number;
  updatedAt: number;
}

export interface DoansoSaveState {
  gameSlug: "doanso";
  secret: string;
  length: number;
  difficulty: "easy" | "medium" | "hard";
  history: { guess: string; correctPosition: number; correctValueOnly: number }[];
  hintsUsed: number;
  elapsedSeconds: number;
  updatedAt: number;
}

export interface SolitaireSaveState {
  gameSlug: "solitaire";
  stock: any[];
  waste: any[];
  foundations: any[][];
  tableaus: any[][];
  history: any[];
  status: "playing" | "won";
  moves: number;
  elapsedSeconds: number;
  updatedAt: number;
}

export type AnySaveState = SudokuSaveState | CaroSaveState | MinesweeperSaveState | ChessSaveState | DoansoSaveState | SolitaireSaveState;

export interface PendingSession {
  id: string;
  gameSlug: string;
  difficulty: string | null;
  durationSeconds: number | null;
  hintsUsed: number;
  completed: boolean;
  createdAt: string;
}

interface GameHubDB extends DBSchema {
  saves: {
    key: string; // e.g. "sudoku", "caro"
    value: AnySaveState;
  };
  "pending-sessions": {
    key: string;
    value: PendingSession;
  };
}

let dbPromise: Promise<IDBPDatabase<GameHubDB>> | null = null;

function getDB() {
  if (typeof window === "undefined") {
    throw new Error("IndexedDB is only available in the browser");
  }
  if (!dbPromise) {
    dbPromise = openDB<GameHubDB>("gamehub", 1, {
      upgrade(db) {
        if (!db.objectStoreNames.contains("saves")) {
          db.createObjectStore("saves");
        }
        if (!db.objectStoreNames.contains("pending-sessions")) {
          db.createObjectStore("pending-sessions", { keyPath: "id" });
        }
      },
    });
  }
  return dbPromise;
}

export async function saveSudokuProgress(state: SudokuSaveState): Promise<void> {
  const db = await getDB();
  await db.put("saves", state, "sudoku");
}

export async function loadSudokuProgress(): Promise<SudokuSaveState | undefined> {
  const db = await getDB();
  const result = await db.get("saves", "sudoku");
  return result?.gameSlug === "sudoku" ? result : undefined;
}

export async function clearSudokuProgress(): Promise<void> {
  const db = await getDB();
  await db.delete("saves", "sudoku");
}

export async function saveCaroProgress(state: CaroSaveState): Promise<void> {
  const db = await getDB();
  await db.put("saves", state, "caro");
}

export async function loadCaroProgress(): Promise<CaroSaveState | undefined> {
  const db = await getDB();
  const result = await db.get("saves", "caro");
  return result?.gameSlug === "caro" ? result : undefined;
}

export async function clearCaroProgress(): Promise<void> {
  const db = await getDB();
  await db.delete("saves", "caro");
}

export async function saveMinesweeperProgress(state: MinesweeperSaveState): Promise<void> {
  const db = await getDB();
  await db.put("saves", state, "minesweeper");
}

export async function loadMinesweeperProgress(): Promise<MinesweeperSaveState | undefined> {
  const db = await getDB();
  const result = await db.get("saves", "minesweeper");
  return result?.gameSlug === "minesweeper" ? result : undefined;
}

export async function clearMinesweeperProgress(): Promise<void> {
  const db = await getDB();
  await db.delete("saves", "minesweeper");
}

export async function saveChessProgress(state: ChessSaveState): Promise<void> {
  const db = await getDB();
  await db.put("saves", state, "chess");
}

export async function loadChessProgress(): Promise<ChessSaveState | undefined> {
  const db = await getDB();
  const result = await db.get("saves", "chess");
  return result?.gameSlug === "chess" ? result : undefined;
}

export async function clearChessProgress(): Promise<void> {
  const db = await getDB();
  await db.delete("saves", "chess");
}

export async function saveDoansoProgress(state: DoansoSaveState): Promise<void> {
  const db = await getDB();
  await db.put("saves", state, "doanso");
}

export async function loadDoansoProgress(): Promise<DoansoSaveState | undefined> {
  const db = await getDB();
  const result = await db.get("saves", "doanso");
  return result?.gameSlug === "doanso" ? result : undefined;
}

export async function clearDoansoProgress(): Promise<void> {
  const db = await getDB();
  await db.delete("saves", "doanso");
}

export async function saveSolitaireProgress(state: SolitaireSaveState): Promise<void> {
  const db = await getDB();
  await db.put("saves", state, "solitaire");
}

export async function loadSolitaireProgress(): Promise<SolitaireSaveState | undefined> {
  const db = await getDB();
  const result = await db.get("saves", "solitaire");
  return result?.gameSlug === "solitaire" ? result : undefined;
}

export async function clearSolitaireProgress(): Promise<void> {
  const db = await getDB();
  await db.delete("saves", "solitaire");
}

export async function queuePendingSession(session: PendingSession): Promise<void> {
  const db = await getDB();
  await db.put("pending-sessions", session);
}

export async function getPendingSessions(): Promise<PendingSession[]> {
  const db = await getDB();
  return db.getAll("pending-sessions");
}

export async function removePendingSession(id: string): Promise<void> {
  const db = await getDB();
  await db.delete("pending-sessions", id);
}
