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
    key: string; // e.g. "sudoku"
    value: SudokuSaveState;
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
  return db.get("saves", "sudoku");
}

export async function clearSudokuProgress(): Promise<void> {
  const db = await getDB();
  await db.delete("saves", "sudoku");
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
