"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { RotateCcw, Trophy, HelpCircle, Delete, CornerDownLeft, Sparkles } from "lucide-react";
import { GameBackButton } from "@/components/ui/GameBackButton";
import { getRandomWord } from "../data/words";
import { playSound } from "@/lib/sound";

const KEYBOARD_ROWS = [
  ["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P"],
  ["A", "S", "D", "F", "G", "H", "J", "K", "L"],
  ["ENTER", "Z", "X", "C", "V", "B", "N", "M", "DELETE"],
];

export function WordleGame() {
  const [lang, setLang] = useState<"en" | "vi">("en");
  const [targetWord, setTargetWord] = useState<string>("");
  const [guesses, setGuesses] = useState<string[]>([]);
  const [currentGuess, setCurrentGuess] = useState<string>("");
  const [gameStatus, setGameStatus] = useState<"playing" | "won" | "lost">("playing");

  const [keyStates, setKeyStates] = useState<Record<string, "correct" | "present" | "absent">>({});

  // Reset Game
  const startNewGame = useCallback(() => {
    const word = getRandomWord(lang);
    setTargetWord(word);
    setGuesses([]);
    setCurrentGuess("");
    setGameStatus("playing");
    setKeyStates({});
  }, [lang]);

  useEffect(() => {
    startNewGame();
  }, [startNewGame]);

  // Submit Guess
  const submitGuess = useCallback(() => {
    if (currentGuess.length !== 5 || gameStatus !== "playing") return;

    const newGuesses = [...guesses, currentGuess];
    setGuesses(newGuesses);

    // Update keyboard statuses
    const newKeyStates = { ...keyStates };
    for (let i = 0; i < 5; i++) {
      const char = currentGuess[i];
      if (targetWord[i] === char) {
        newKeyStates[char] = "correct";
      } else if (targetWord.includes(char) && newKeyStates[char] !== "correct") {
        newKeyStates[char] = "present";
      } else if (!targetWord.includes(char)) {
        newKeyStates[char] = "absent";
      }
    }
    setKeyStates(newKeyStates);

    if (currentGuess === targetWord) {
      setGameStatus("won");
      playSound("win");
    } else if (newGuesses.length >= 6) {
      setGameStatus("lost");
      playSound("lose");
    } else {
      playSound("click");
    }

    setCurrentGuess("");
  }, [currentGuess, gameStatus, guesses, keyStates, targetWord]);

  // Keyboard input handler
  const handleCharInput = useCallback(
    (char: string) => {
      if (gameStatus !== "playing") return;
      if (char === "ENTER") {
        submitGuess();
      } else if (char === "DELETE" || char === "BACKSPACE") {
        setCurrentGuess((prev) => prev.slice(0, -1));
      } else if (/^[A-Z]$/.test(char) && currentGuess.length < 5) {
        setCurrentGuess((prev) => prev + char);
      }
    },
    [currentGuess.length, gameStatus, submitGuess]
  );

  // Listen to physical keyboard events
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toUpperCase();
      if (key === "ENTER" || key === "BACKSPACE" || /^[A-Z]$/.test(key)) {
        handleCharInput(key);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleCharInput]);

  return (
    <div className="flex w-full max-w-xl flex-col items-center gap-6 px-4 py-6">
      {/* Top Header */}
      <div className="flex w-full items-center justify-between">
        <GameBackButton />
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setLang((l) => (l === "en" ? "vi" : "en"));
            }}
            type="button"
            className="rounded-xl border border-amber-400/40 bg-amber-400/10 px-3 py-1.5 text-xs font-bold text-amber-400"
          >
            {lang === "en" ? "Tiếng Anh 🇬🇧" : "Tiếng Việt 🇻🇳"}
          </button>
        </div>
      </div>

      {/* Title */}
      <div className="text-center">
        <h1 className="font-display text-3xl font-extrabold text-foreground sm:text-4xl">
          WORDLE (ĐOÁN TỪ 5 CHỮ) 🔤
        </h1>
        <p className="mt-1 text-xs text-muted">
          Đoán đúng từ 5 chữ cái trong tối đa 6 lượt thử!
        </p>
      </div>

      {/* 6x5 Grid */}
      <div className="grid grid-rows-6 gap-2 py-2">
        {Array.from({ length: 6 }).map((_, rowIdx) => {
          const isCurrentRow = rowIdx === guesses.length;
          const rowGuess =
            rowIdx < guesses.length
              ? guesses[rowIdx]
              : isCurrentRow
              ? currentGuess
              : "";

          return (
            <div key={rowIdx} className="flex gap-2">
              {Array.from({ length: 5 }).map((_, colIdx) => {
                const char = rowGuess[colIdx] || "";
                let bgColor = "border-border bg-surface text-foreground";

                if (rowIdx < guesses.length) {
                  if (targetWord[colIdx] === char) {
                    bgColor = "border-emerald-500 bg-emerald-500 text-white font-bold shadow-lg shadow-emerald-500/20";
                  } else if (targetWord.includes(char)) {
                    bgColor = "border-amber-400 bg-amber-400 text-ink-950 font-bold shadow-lg shadow-amber-400/20";
                  } else {
                    bgColor = "border-slate-700 bg-slate-800 text-slate-400 font-bold";
                  }
                }

                return (
                  <motion.div
                    key={colIdx}
                    animate={char ? { scale: [1, 1.1, 1] } : { scale: 1 }}
                    transition={{ duration: 0.15 }}
                    className={`flex h-14 w-14 items-center justify-center rounded-2xl border-2 font-mono text-2xl uppercase transition-colors ${bgColor}`}
                  >
                    {char}
                  </motion.div>
                );
              })}
            </div>
          );
        })}
      </div>

      {/* On-screen Virtual Keyboard */}
      <div className="flex w-full max-w-md flex-col gap-1.5">
        {KEYBOARD_ROWS.map((row, rIdx) => (
          <div key={rIdx} className="flex justify-center gap-1">
            {row.map((key) => {
              const state = keyStates[key];
              let btnClass = "bg-surface-hover text-foreground hover:bg-border";
              if (state === "correct") btnClass = "bg-emerald-500 text-white font-bold";
              else if (state === "present") btnClass = "bg-amber-400 text-ink-950 font-bold";
              else if (state === "absent") btnClass = "bg-slate-800 text-slate-500 opacity-60";

              return (
                <button
                  key={key}
                  onClick={() => handleCharInput(key)}
                  type="button"
                  className={`flex h-12 items-center justify-center rounded-xl font-mono text-xs font-bold transition active:scale-95 ${
                    key === "ENTER" || key === "DELETE" ? "px-3" : "w-9"
                  } ${btnClass}`}
                >
                  {key === "DELETE" ? <Delete size={18} /> : key}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      {/* Restart Button */}
      <button
        onClick={startNewGame}
        type="button"
        className="flex items-center gap-2 rounded-xl bg-amber-400 px-6 py-2.5 font-bold text-ink-950 transition hover:bg-amber-500 active:scale-[0.98]"
      >
        <RotateCcw size={16} /> Từ mới khác 🎲
      </button>

      {/* End Game Modal */}
      <AnimatePresence>
        {gameStatus !== "playing" && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="flex w-full max-w-sm flex-col items-center rounded-3xl border border-amber-400/40 bg-surface p-6 text-center shadow-2xl"
            >
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-amber-400/20 text-amber-400">
                <Trophy size={36} />
              </div>
              <h2 className="mt-4 font-display text-2xl font-bold text-foreground">
                {gameStatus === "won" ? "BẠN ĐÃ THẮNG! 🎉" : "KẾT THÚC VÁN!"}
              </h2>
              <p className="mt-2 text-sm text-muted">
                Từ bí ẩn là: <span className="font-mono font-extrabold text-amber-400 text-lg">{targetWord}</span>
              </p>

              <button
                onClick={startNewGame}
                type="button"
                className="mt-6 w-full rounded-xl bg-amber-400 py-3 font-bold text-ink-950 transition hover:bg-amber-500 active:scale-[0.98]"
              >
                Chơi tiếp từ khác 🎲
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
