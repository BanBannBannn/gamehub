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

export type AnySaveState = SudokuSaveState | CaroSaveState | MinesweeperSaveState;

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
