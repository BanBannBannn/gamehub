import { create } from "zustand";
import {
  CellValue,
  Difficulty,
  Grid,
  findConflicts,
  generatePuzzle,
  getHint,
  isComplete,
} from "@/games/sudoku/engine";

interface HistoryEntry {
  board: Grid;
  notes: number[][];
}

export interface SudokuState {
  puzzle: Grid;
  solution: Grid;
  board: Grid;
  notes: number[][]; // notes[i] = array of pencil-marked digits for cell i
  difficulty: Difficulty;
  selectedIndex: number | null;
  history: HistoryEntry[];
  future: HistoryEntry[];
  hintsUsed: number;
  lastHintIndex: number | null;
  lastHintReason: string | null;
  elapsedSeconds: number;
  isRunning: boolean;
  isComplete: boolean;
  pencilMode: boolean;
  highlightConflicts: boolean;

  startNewGame: (difficulty: Difficulty) => void;
  loadSavedGame: (state: {
    puzzle: Grid;
    solution: Grid;
    board: Grid;
    notes: number[][];
    difficulty: Difficulty;
    elapsedSeconds: number;
    hintsUsed: number;
  }) => void;
  selectCell: (index: number) => void;
  inputValue: (value: CellValue) => void;
  clearCell: () => void;
  togglePencilMode: () => void;
  toggleHighlightConflicts: () => void;
  undo: () => void;
  redo: () => void;
  useHint: () => void;
  tick: () => void;
  setRunning: (running: boolean) => void;
  conflicts: () => Set<number>;
}

function emptyNotes(): number[][] {
  return Array.from({ length: 81 }, () => []);
}

export const useSudokuStore = create<SudokuState>((set, get) => ({
  puzzle: new Array(81).fill(0) as Grid,
  solution: new Array(81).fill(0) as Grid,
  board: new Array(81).fill(0) as Grid,
  notes: emptyNotes(),
  difficulty: "easy",
  selectedIndex: null,
  history: [],
  future: [],
  hintsUsed: 0,
  lastHintIndex: null,
  lastHintReason: null,
  elapsedSeconds: 0,
  isRunning: false,
  isComplete: false,
  pencilMode: false,
  highlightConflicts: true,

  startNewGame: (difficulty) => {
    const { puzzle, solution } = generatePuzzle(difficulty);
    set({
      puzzle,
      solution,
      board: [...puzzle] as Grid,
      notes: emptyNotes(),
      difficulty,
      selectedIndex: null,
      history: [],
      future: [],
      hintsUsed: 0,
      lastHintIndex: null,
      lastHintReason: null,
      elapsedSeconds: 0,
      isRunning: true,
      isComplete: false,
    });
  },

  loadSavedGame: (state) => {
    set({
      puzzle: state.puzzle,
      solution: state.solution,
      board: state.board,
      notes: state.notes,
      difficulty: state.difficulty,
      selectedIndex: null,
      history: [],
      future: [],
      hintsUsed: state.hintsUsed,
      lastHintIndex: null,
      lastHintReason: null,
      elapsedSeconds: state.elapsedSeconds,
      isRunning: true,
      isComplete: isComplete(state.board),
    });
  },

  selectCell: (index) => set({ selectedIndex: index }),

  inputValue: (value) => {
    const { selectedIndex, puzzle, board, notes, pencilMode } = get();
    if (selectedIndex === null) return;
    if (puzzle[selectedIndex] !== 0) return; // can't overwrite a given clue

    const prevEntry: HistoryEntry = { board: [...board] as Grid, notes: notes.map((n) => [...n]) };

    if (pencilMode) {
      const nextNotes = notes.map((n) => [...n]);
      const cellNotes = nextNotes[selectedIndex];
      const pos = cellNotes.indexOf(value);
      if (pos >= 0) cellNotes.splice(pos, 1);
      else cellNotes.push(value);
      set((s) => ({
        notes: nextNotes,
        history: [...s.history, prevEntry],
        future: [],
      }));
      return;
    }

    const nextBoard = [...board] as Grid;
    nextBoard[selectedIndex] = nextBoard[selectedIndex] === value ? 0 : value;
    const nextNotes = notes.map((n, i) => (i === selectedIndex ? [] : n));

    const complete = isComplete(nextBoard);
    set((s) => ({
      board: nextBoard,
      notes: nextNotes,
      history: [...s.history, prevEntry],
      future: [],
      isComplete: complete,
      isRunning: complete ? false : s.isRunning,
    }));
  },

  clearCell: () => {
    const { selectedIndex, puzzle, board, notes } = get();
    if (selectedIndex === null) return;
    if (puzzle[selectedIndex] !== 0) return;
    if (board[selectedIndex] === 0 && notes[selectedIndex].length === 0) return;

    const prevEntry: HistoryEntry = { board: [...board] as Grid, notes: notes.map((n) => [...n]) };
    const nextBoard = [...board] as Grid;
    nextBoard[selectedIndex] = 0;
    const nextNotes = notes.map((n, i) => (i === selectedIndex ? [] : n));

    set((s) => ({
      board: nextBoard,
      notes: nextNotes,
      history: [...s.history, prevEntry],
      future: [],
    }));
  },

  togglePencilMode: () => set((s) => ({ pencilMode: !s.pencilMode })),
  toggleHighlightConflicts: () => set((s) => ({ highlightConflicts: !s.highlightConflicts })),

  undo: () => {
    const { history, board, notes } = get();
    if (history.length === 0) return;
    const last = history[history.length - 1];
    const currentEntry: HistoryEntry = { board: [...board] as Grid, notes: notes.map((n) => [...n]) };
    set((s) => ({
      board: last.board,
      notes: last.notes,
      history: s.history.slice(0, -1),
      future: [...s.future, currentEntry],
      isComplete: false,
      isRunning: true,
    }));
  },

  redo: () => {
    const { future, board, notes } = get();
    if (future.length === 0) return;
    const next = future[future.length - 1];
    const currentEntry: HistoryEntry = { board: [...board] as Grid, notes: notes.map((n) => [...n]) };
    set((s) => ({
      board: next.board,
      notes: next.notes,
      future: s.future.slice(0, -1),
      history: [...s.history, currentEntry],
      isComplete: isComplete(next.board),
    }));
  },

  useHint: () => {
    const { board } = get();
    const hint = getHint(board);
    if (!hint) return;

    const prevEntry: HistoryEntry = {
      board: [...board] as Grid,
      notes: get().notes.map((n) => [...n]),
    };
    const nextBoard = [...board] as Grid;
    nextBoard[hint.index] = hint.value;
    const nextNotes = get().notes.map((n, i) => (i === hint.index ? [] : n));
    const complete = isComplete(nextBoard);

    set((s) => ({
      board: nextBoard,
      notes: nextNotes,
      history: [...s.history, prevEntry],
      future: [],
      hintsUsed: s.hintsUsed + 1,
      lastHintIndex: hint.index,
      lastHintReason: hint.reason,
      selectedIndex: hint.index,
      isComplete: complete,
      isRunning: complete ? false : s.isRunning,
    }));
  },

  tick: () => {
    if (!get().isRunning) return;
    set((s) => ({ elapsedSeconds: s.elapsedSeconds + 1 }));
  },

  setRunning: (running) => set({ isRunning: running }),

  conflicts: () => findConflicts(get().board),
}));
