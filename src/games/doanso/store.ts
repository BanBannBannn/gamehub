import { create } from "zustand";
import {
  Difficulty,
  DIFFICULTY_LENGTH,
  GuessResult,
  evaluateGuess,
  generateSecret,
  getHint,
  isValidGuessFormat,
} from "@/games/doanso/engine";

export interface DoansoState {
  secret: string;
  length: number;
  difficulty: Difficulty;
  history: GuessResult[];
  currentInput: string;
  status: "playing" | "won";
  hintsUsed: number;
  lastHintSuggestion: string | null;
  lastHintReason: string | null;
  elapsedSeconds: number;
  isRunning: boolean;
  errorMessage: string | null;

  startNewGame: (difficulty: Difficulty) => void;
  loadSavedGame: (state: {
    secret: string;
    length: number;
    difficulty: Difficulty;
    history: GuessResult[];
    hintsUsed: number;
    elapsedSeconds: number;
  }) => void;
  setCurrentInput: (value: string) => void;
  submitGuess: () => void;
  useHint: () => void;
  tick: () => void;
}

export const useDoansoStore = create<DoansoState>((set, get) => ({
  secret: "",
  length: DIFFICULTY_LENGTH.medium,
  difficulty: "medium",
  history: [],
  currentInput: "",
  status: "playing",
  hintsUsed: 0,
  lastHintSuggestion: null,
  lastHintReason: null,
  elapsedSeconds: 0,
  isRunning: false,
  errorMessage: null,

  startNewGame: (difficulty) => {
    const length = DIFFICULTY_LENGTH[difficulty];
    set({
      secret: generateSecret(length),
      length,
      difficulty,
      history: [],
      currentInput: "",
      status: "playing",
      hintsUsed: 0,
      lastHintSuggestion: null,
      lastHintReason: null,
      elapsedSeconds: 0,
      isRunning: true,
      errorMessage: null,
    });
  },

  loadSavedGame: (state) => {
    const won = state.history.some((h) => h.correctPosition === state.length);
    set({
      secret: state.secret,
      length: state.length,
      difficulty: state.difficulty,
      history: state.history,
      currentInput: "",
      status: won ? "won" : "playing",
      hintsUsed: state.hintsUsed,
      lastHintSuggestion: null,
      lastHintReason: null,
      elapsedSeconds: state.elapsedSeconds,
      isRunning: !won,
      errorMessage: null,
    });
  },

  setCurrentInput: (value) => set({ currentInput: value, errorMessage: null }),

  submitGuess: () => {
    const { currentInput, length, secret, status, history } = get();
    if (status !== "playing") return;
    if (!isValidGuessFormat(currentInput, length)) {
      set({ errorMessage: `Vui lòng nhập đúng ${length} chữ số.` });
      return;
    }

    const { correctPosition, correctValueOnly } = evaluateGuess(secret, currentInput);
    const result: GuessResult = { guess: currentInput, correctPosition, correctValueOnly };
    const won = correctPosition === length;

    set({
      history: [result, ...history],
      currentInput: "",
      status: won ? "won" : "playing",
      isRunning: !won,
      errorMessage: null,
      lastHintSuggestion: null,
      lastHintReason: null,
    });
  },

  useHint: () => {
    const { history, length, status } = get();
    if (status !== "playing") return;
    const hint = getHint(history, length);
    set((s) => ({
      lastHintSuggestion: hint.suggestion,
      lastHintReason: hint.reason,
      hintsUsed: s.hintsUsed + 1,
    }));
  },

  tick: () => {
    if (!get().isRunning) return;
    set((s) => ({ elapsedSeconds: s.elapsedSeconds + 1 }));
  },
}));
