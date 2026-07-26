"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Keyboard, Zap, Flame, Trophy, RotateCcw, Plus, Trash2, Settings2, Sparkles, Volume2, VolumeX } from "lucide-react";
import { GameBackButton } from "@/components/ui/GameBackButton";
import {
  ENGLISH_WORDS,
  VIETNAMESE_NO_ACCENT_WORDS,
  TECH_PARAGRAPHS,
  CustomWordSet,
  getCustomWordSets,
  saveCustomWordSet,
  deleteCustomWordSet,
} from "../data/words";

// Web Audio API Mechanical Keyboard Sound Synthesizer
let audioCtx: AudioContext | null = null;
function playMechClick(isError = false) {
  try {
    if (!audioCtx) {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      audioCtx = new AudioContextClass();
    }
    if (audioCtx.state === "suspended") {
      void audioCtx.resume();
    }

    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    if (isError) {
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(150, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(80, audioCtx.currentTime + 0.08);
      gain.gain.setValueAtTime(0.25, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.08);
    } else {
      osc.type = "sine";
      osc.frequency.setValueAtTime(600 + Math.random() * 200, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(120, audioCtx.currentTime + 0.04);
      gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.04);
    }

    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.08);
  } catch {
    // Ignore audio errors if muted or unsupported
  }
}

interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
}

export function TypingGame() {
  // Config States
  const [category, setCategory] = useState<"en" | "vi" | "tech" | "custom">("en");
  const [durationMode, setDurationMode] = useState<number>(30); // 30s, 60s, 120s
  const [customSets, setCustomSets] = useState<CustomWordSet[]>([]);
  const [selectedCustomId, setSelectedCustomId] = useState<string>("");

  // Game Engine States
  const [targetText, setTargetText] = useState<string>("");
  const [userInput, setUserInput] = useState<string>("");
  const [timeLeft, setTimeLeft] = useState<number>(30);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isFinished, setIsFinished] = useState<boolean>(false);

  // Stats
  const [combo, setCombo] = useState<number>(0);
  const [maxCombo, setMaxCombo] = useState<number>(0);
  const [correctHits, setCorrectHits] = useState<number>(0);
  const [wrongHits, setWrongHits] = useState<number>(0);
  const [screenShake, setScreenShake] = useState<boolean>(false);

  // Particles
  const [particles, setParticles] = useState<Particle[]>([]);

  // Modal custom word editor
  const [showCustomModal, setShowCustomModal] = useState<boolean>(false);
  const [newSetName, setNewSetName] = useState<string>("");
  const [newSetText, setNewSetText] = useState<string>("");

  const inputRef = useRef<HTMLInputElement>(null);

  // Load custom sets from localStorage
  useEffect(() => {
    const loaded = getCustomWordSets();
    setCustomSets(loaded);
    if (loaded.length > 0) {
      setSelectedCustomId(loaded[0].id);
    }
  }, []);

  // Generate target text based on category
  const generateText = useCallback(() => {
    let sourceWords: string[] = [];

    if (category === "en") {
      sourceWords = ENGLISH_WORDS;
    } else if (category === "vi") {
      sourceWords = VIETNAMESE_NO_ACCENT_WORDS;
    } else if (category === "tech") {
      sourceWords = TECH_PARAGRAPHS.flatMap((p) => p.split(" "));
    } else if (category === "custom") {
      const found = customSets.find((s) => s.id === selectedCustomId);
      if (found && found.text.trim()) {
        return found.text.trim();
      }
      sourceWords = ["vui", "long", "them", "bo", "tu", "custom", "cua", "ban"];
    }

    // Shuffle & pick 60 words
    const shuffled = [...sourceWords].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, 60).join(" ");
  }, [category, customSets, selectedCustomId]);

  // Restart / Reset Game
  const resetGame = useCallback(() => {
    const text = generateText();
    setTargetText(text);
    setUserInput("");
    setTimeLeft(durationMode);
    setIsPlaying(false);
    setIsFinished(false);
    setCombo(0);
    setMaxCombo(0);
    setCorrectHits(0);
    setWrongHits(0);
    setParticles([]);
  }, [durationMode, generateText]);

  useEffect(() => {
    resetGame();
  }, [resetGame]);

  // Timer countdown loop
  useEffect(() => {
    if (!isPlaying || isFinished) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setIsFinished(true);
          setIsPlaying(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [isFinished, isPlaying]);

  // Particle updates
  useEffect(() => {
    if (particles.length === 0) return;
    const pTimer = setInterval(() => {
      setParticles((prev) =>
        prev
          .map((p) => ({
            ...p,
            x: p.x + p.vx,
            y: p.y + p.vy,
            size: p.size * 0.9,
          }))
          .filter((p) => p.size > 0.5)
      );
    }, 30);
    return () => clearInterval(pTimer);
  }, [particles]);

  // Spawn particle burst at current input cursor
  const spawnSparkles = () => {
    const colors = ["#00f0ff", "#00ff66", "#ff007f", "#ffd700"];
    const newP: Particle[] = [];
    for (let i = 0; i < 6; i++) {
      newP.push({
        id: Math.random(),
        x: (userInput.length * 10) % 400 + 20,
        y: 60 + Math.random() * 20,
        vx: (Math.random() - 0.5) * 8,
        vy: (Math.random() - 0.5) * 8,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: Math.random() * 5 + 3,
      });
    }
    setParticles((prev) => [...prev.slice(-20), ...newP]);
  };

  // Handle typing key input
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isFinished) return;

    if (!isPlaying) {
      setIsPlaying(true);
    }

    const val = e.target.value;

    // Check last character typed
    if (val.length > userInput.length) {
      const typedChar = val[val.length - 1];
      const targetChar = targetText[val.length - 1];

      if (typedChar === targetChar) {
        // Correct Hit
        playMechClick(false);
        spawnSparkles();
        const nextCombo = combo + 1;
        setCombo(nextCombo);
        if (nextCombo > maxCombo) setMaxCombo(nextCombo);
        setCorrectHits((c) => c + 1);

        // Screen Shake on Combo Milestones (10x, 20x, 30x)
        if (nextCombo > 0 && nextCombo % 10 === 0) {
          setScreenShake(true);
          setTimeout(() => setScreenShake(false), 250);
        }
      } else {
        // Wrong Hit
        playMechClick(true);
        setCombo(0);
        setWrongHits((w) => w + 1);
      }
    }

    setUserInput(val);

    // If completed target text before time ends
    if (val.length >= targetText.length) {
      setIsFinished(true);
      setIsPlaying(false);
    }
  };

  // Save Custom Word Set
  const handleCreateCustomSet = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSetText.trim()) return;
    const updated = saveCustomWordSet(newSetName, newSetText);
    setCustomSets(updated);
    if (updated.length > 0) {
      setSelectedCustomId(updated[0].id);
      setCategory("custom");
    }
    setNewSetName("");
    setNewSetText("");
    setShowCustomModal(false);
  };

  // Delete Custom Word Set
  const handleDeleteCustomSet = (id: string) => {
    const updated = deleteCustomWordSet(id);
    setCustomSets(updated);
    if (updated.length > 0) {
      setSelectedCustomId(updated[0].id);
    } else {
      setCategory("en");
    }
  };

  // Calculations: WPM & Accuracy
  const timeElapsed = durationMode - timeLeft;
  const timeInMinutes = (timeElapsed > 0 ? timeElapsed : 1) / 60;
  const grossWpm = Math.round(userInput.length / 5 / timeInMinutes) || 0;
  const netWpm = Math.max(0, Math.round((userInput.length / 5 - wrongHits) / timeInMinutes)) || 0;
  const accuracy =
    correctHits + wrongHits > 0
      ? Math.round((correctHits / (correctHits + wrongHits)) * 100)
      : 100;

  // Title rank evaluation
  const getRankTitle = (wpm: number) => {
    if (wpm >= 90) return { title: "⚡ GODLIKE TYPER", color: "text-amber-400" };
    if (wpm >= 70) return { title: "🔥 SPEED DEMON", color: "text-rose-500" };
    if (wpm >= 50) return { title: "💎 CYBER TYPER", color: "text-cyan-400" };
    if (wpm >= 30) return { title: "⌨️ KEYBOARD WARRIOR", color: "text-emerald-400" };
    return { title: "🌱 NOVICE TYPER", color: "text-slate-400" };
  };

  return (
    <div
      className={`flex w-full max-w-4xl flex-col items-center gap-6 px-4 py-6 transition-transform duration-75 ${
        screenShake ? "translate-x-1 translate-y-1" : ""
      }`}
    >
      {/* Top Header & Navigation */}
      <div className="flex w-full items-center justify-between">
        <GameBackButton />
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowCustomModal(true)}
            type="button"
            className="flex items-center gap-1.5 rounded-xl border border-cyan-500/40 bg-cyan-500/10 px-3.5 py-1.5 text-xs font-semibold text-cyan-400 transition hover:bg-cyan-500/20 active:scale-[0.98]"
          >
            <Plus size={14} /> Thêm Bộ Từ Custom
          </button>
        </div>
      </div>

      {/* Cyberpunk Title Banner */}
      <div className="text-center">
        <h1 className="font-display text-3xl font-extrabold tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-pink-500 to-amber-400 drop-shadow-[0_0_15px_rgba(0,240,255,0.4)] sm:text-4xl">
          CYBER TYPING STRIKE ⚡
        </h1>
        <p className="mt-1 text-xs text-cyan-400/80 tracking-widest uppercase font-mono">
          Neon Arcade Typing Simulator • Dynamic WPM Meter
        </p>
      </div>

      {/* Config Bar */}
      <div className="flex w-full flex-wrap items-center justify-between gap-3 rounded-2xl border border-cyan-500/20 bg-slate-950/80 p-4 backdrop-blur-md">
        {/* Category Picker */}
        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() => setCategory("en")}
            type="button"
            className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
              category === "en"
                ? "bg-cyan-500 text-slate-950 shadow-[0_0_12px_rgba(0,240,255,0.6)]"
                : "bg-slate-900 text-slate-400 hover:text-slate-200"
            }`}
          >
            Tiếng Anh 🇬🇧
          </button>
          <button
            onClick={() => setCategory("vi")}
            type="button"
            className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
              category === "vi"
                ? "bg-pink-500 text-slate-950 shadow-[0_0_12px_rgba(255,0,127,0.6)]"
                : "bg-slate-900 text-slate-400 hover:text-slate-200"
            }`}
          >
            Tiếng Việt (Không dấu) 🇻🇳
          </button>
          <button
            onClick={() => setCategory("tech")}
            type="button"
            className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
              category === "tech"
                ? "bg-amber-400 text-slate-950 shadow-[0_0_12px_rgba(251,191,36,0.6)]"
                : "bg-slate-900 text-slate-400 hover:text-slate-200"
            }`}
          >
            Thuật Ngữ IT 💻
          </button>
          {customSets.length > 0 && (
            <button
              onClick={() => setCategory("custom")}
              type="button"
              className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                category === "custom"
                  ? "bg-emerald-400 text-slate-950 shadow-[0_0_12px_rgba(52,211,153,0.6)]"
                  : "bg-slate-900 text-slate-400 hover:text-slate-200"
              }`}
            >
              Bộ Từ Custom ({customSets.length}) ⭐
            </button>
          )}
        </div>

        {/* Custom Set Select Dropdown if category custom */}
        {category === "custom" && customSets.length > 0 && (
          <div className="flex items-center gap-2">
            <select
              value={selectedCustomId}
              onChange={(e) => setSelectedCustomId(e.target.value)}
              className="rounded-lg border border-emerald-500/40 bg-slate-900 px-2.5 py-1 text-xs font-mono text-emerald-400 outline-none"
            >
              {customSets.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
            <button
              onClick={() => handleDeleteCustomSet(selectedCustomId)}
              type="button"
              title="Xóa bộ từ này"
              className="text-rose-400 hover:text-rose-300"
            >
              <Trash2 size={14} />
            </button>
          </div>
        )}

        {/* Duration Timer Picker */}
        <div className="flex items-center gap-1 bg-slate-900/80 p-1 rounded-xl border border-slate-800">
          {[30, 60, 120].map((sec) => (
            <button
              key={sec}
              onClick={() => setDurationMode(sec)}
              type="button"
              className={`rounded-lg px-2.5 py-1 text-xs font-mono font-bold transition ${
                durationMode === sec ? "bg-slate-800 text-amber-400" : "text-slate-500 hover:text-slate-300"
              }`}
            >
              {sec}s
            </button>
          ))}
        </div>
      </div>

      {/* Real-time HUD (WPM, Accuracy, Combo, Timer) */}
      <div className="grid w-full grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="flex flex-col items-center justify-center rounded-2xl border border-cyan-500/30 bg-slate-950/80 p-3 text-center shadow-[0_0_15px_rgba(0,240,255,0.1)]">
          <span className="text-[10px] font-mono font-bold text-cyan-400/70 tracking-widest uppercase">WPM (TỐC ĐỘ)</span>
          <span className="font-mono text-2xl font-extrabold text-cyan-400 drop-shadow-[0_0_8px_rgba(0,240,255,0.8)]">
            {grossWpm}
          </span>
        </div>

        <div className="flex flex-col items-center justify-center rounded-2xl border border-pink-500/30 bg-slate-950/80 p-3 text-center shadow-[0_0_15px_rgba(255,0,127,0.1)]">
          <span className="text-[10px] font-mono font-bold text-pink-400/70 tracking-widest uppercase">CHÍNH XÁC</span>
          <span className="font-mono text-2xl font-extrabold text-pink-400 drop-shadow-[0_0_8px_rgba(255,0,127,0.8)]">
            {accuracy}%
          </span>
        </div>

        <div className="flex flex-col items-center justify-center rounded-2xl border border-amber-400/30 bg-slate-950/80 p-3 text-center shadow-[0_0_15px_rgba(251,191,36,0.1)]">
          <span className="text-[10px] font-mono font-bold text-amber-400/70 tracking-widest uppercase flex items-center gap-1">
            <Flame size={12} /> COMBO
          </span>
          <span className="font-mono text-2xl font-extrabold text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.8)]">
            {combo}x
          </span>
        </div>

        <div className="flex flex-col items-center justify-center rounded-2xl border border-emerald-400/30 bg-slate-950/80 p-3 text-center shadow-[0_0_15px_rgba(52,211,153,0.1)]">
          <span className="text-[10px] font-mono font-bold text-emerald-400/70 tracking-widest uppercase">THỜI GIAN</span>
          <span className="font-mono text-2xl font-extrabold text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.8)]">
            {timeLeft}s
          </span>
        </div>
      </div>

      {/* Cyberpunk Main Typing Stage Box */}
      <div
        onClick={() => inputRef.current?.focus()}
        className="relative flex w-full flex-col gap-4 rounded-3xl border-2 border-cyan-500/40 bg-slate-950 p-6 sm:p-8 shadow-[0_0_30px_rgba(0,240,255,0.15)] cursor-text overflow-hidden"
      >
        {/* Render Particles */}
        {particles.map((p) => (
          <span
            key={p.id}
            style={{
              left: `${p.x}px`,
              top: `${p.y}px`,
              width: `${p.size}px`,
              height: `${p.size}px`,
              backgroundColor: p.color,
              boxShadow: `0 0 10px ${p.color}`,
            }}
            className="absolute rounded-full pointer-events-none transition-all duration-75"
          />
        ))}

        {/* Hidden Input field */}
        <input
          ref={inputRef}
          type="text"
          value={userInput}
          onChange={handleInputChange}
          disabled={isFinished}
          autoFocus
          className="absolute opacity-0 h-0 w-0"
        />

        {/* Target Text Glowing Display */}
        <div className="font-mono text-lg sm:text-xl leading-relaxed tracking-wide select-none min-h-[120px]">
          {targetText.split("").map((char, idx) => {
            let stateClass = "text-slate-600";
            if (idx < userInput.length) {
              if (userInput[idx] === char) {
                stateClass = "text-cyan-400 font-bold drop-shadow-[0_0_8px_rgba(0,240,255,0.9)]";
              } else {
                stateClass = "text-rose-500 font-bold bg-rose-500/20 rounded px-0.5 drop-shadow-[0_0_8px_rgba(244,63,94,0.9)] animate-pulse";
              }
            } else if (idx === userInput.length) {
              stateClass = "text-amber-300 font-extrabold underline decoration-amber-400 decoration-2 underline-offset-4 animate-pulse bg-amber-400/20 px-0.5 rounded";
            }

            return (
              <span key={idx} className={stateClass}>
                {char}
              </span>
            );
          })}
        </div>

        {/* Start / Focus hint banner */}
        {!isPlaying && !isFinished && (
          <div className="flex items-center justify-center gap-2 border-t border-slate-900 pt-4 text-xs font-mono text-cyan-400/80">
            <Zap size={14} className="animate-bounce" />
            <span>Bắt đầu gõ phím để tính giờ!</span>
          </div>
        )}
      </div>

      {/* Restart Button */}
      <button
        onClick={resetGame}
        type="button"
        className="flex items-center gap-2 rounded-xl border border-cyan-500/40 bg-cyan-500/10 px-6 py-2.5 font-mono text-sm font-bold text-cyan-400 transition hover:bg-cyan-500/20 active:scale-[0.98]"
      >
        <RotateCcw size={16} /> Làm mới bài gõ
      </button>

      {/* Modal End Game Scorecard */}
      <AnimatePresence>
        {isFinished && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="flex w-full max-w-md flex-col items-center rounded-3xl border-2 border-cyan-500/50 bg-slate-950 p-6 text-center shadow-[0_0_50px_rgba(0,240,255,0.3)]"
            >
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-cyan-500/20 text-cyan-400 shadow-[0_0_20px_rgba(0,240,255,0.4)]">
                <Trophy size={36} />
              </div>

              <h2 className="mt-4 font-display text-2xl font-bold text-slate-100">Hoàn Thành Bài Gõ!</h2>
              <p className={`mt-1 font-mono font-extrabold text-sm tracking-wider ${getRankTitle(netWpm).color}`}>
                {getRankTitle(netWpm).title}
              </p>

              <div className="mt-6 grid w-full grid-cols-2 gap-3 text-left">
                <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-3">
                  <span className="text-[10px] font-mono text-slate-400">NET WPM</span>
                  <p className="font-mono text-xl font-bold text-cyan-400">{netWpm}</p>
                </div>
                <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-3">
                  <span className="text-[10px] font-mono text-slate-400">GROSS WPM</span>
                  <p className="font-mono text-xl font-bold text-amber-400">{grossWpm}</p>
                </div>
                <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-3">
                  <span className="text-[10px] font-mono text-slate-400">ĐỘ CHÍNH XÁC</span>
                  <p className="font-mono text-xl font-bold text-pink-400">{accuracy}%</p>
                </div>
                <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-3">
                  <span className="text-[10px] font-mono text-slate-400">MAX COMBO</span>
                  <p className="font-mono text-xl font-bold text-emerald-400">{maxCombo}x</p>
                </div>
              </div>

              <button
                onClick={resetGame}
                type="button"
                className="mt-6 w-full rounded-xl bg-gradient-to-r from-cyan-500 to-pink-500 py-3 font-mono font-bold text-slate-950 transition hover:brightness-110 active:scale-[0.98] shadow-[0_0_20px_rgba(0,240,255,0.4)]"
              >
                Gõ lại ván mới ⚡
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal Editor Thêm Bộ Từ Custom */}
      <AnimatePresence>
        {showCustomModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="flex w-full max-w-lg flex-col rounded-3xl border border-slate-800 bg-slate-950 p-6 text-left shadow-2xl"
            >
              <h3 className="font-display text-xl font-bold text-slate-100 flex items-center gap-2">
                ✍️ Tạo Bộ Từ Custom Cá Nhân
              </h3>
              <p className="mt-1 text-xs text-slate-400">
                Nhập đoạn văn bản hoặc danh sách từ của bạn. Dữ liệu sẽ được lưu tự động trong LocalStorage của trình duyệt.
              </p>

              <form onSubmit={handleCreateCustomSet} className="mt-4 flex flex-col gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-300">Tên bộ từ:</label>
                  <input
                    type="text"
                    required
                    placeholder="Ví dụ: Đoạn văn luyện ngón, Từ vựng Anh Văn..."
                    value={newSetName}
                    onChange={(e) => setNewSetName(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-800 bg-slate-900 px-3.5 py-2 text-sm text-slate-200 outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300">Nội dung bài gõ:</label>
                  <textarea
                    required
                    rows={5}
                    placeholder="Dán đoạn văn bản hoặc bộ từ của bạn vào đây..."
                    value={newSetText}
                    onChange={(e) => setNewSetText(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-800 bg-slate-900 p-3.5 text-sm text-slate-200 outline-none focus:border-cyan-500 font-mono"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    onClick={() => setShowCustomModal(false)}
                    type="button"
                    className="rounded-xl border border-slate-800 bg-slate-900 px-4 py-2 text-xs font-bold text-slate-400 hover:text-slate-200"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    className="rounded-xl bg-cyan-500 px-5 py-2 text-xs font-bold text-slate-950 hover:bg-cyan-400 active:scale-[0.98]"
                  >
                    Lưu Bộ Từ ✨
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
