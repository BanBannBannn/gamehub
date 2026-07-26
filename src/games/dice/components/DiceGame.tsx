"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Dices, RotateCcw, User, Bot, Trophy } from "lucide-react";
import { GameBackButton } from "@/components/ui/GameBackButton";
import {
  Player,
  CATEGORIES,
  Category,
  createEmptyScorecard,
  calculateScore,
  calculateUpperBonus,
  calculateTotalScore,
} from "../types";
import { playSound } from "@/lib/sound";

const AVATARS = ["🎲", "🎯", "⚡", "🔥"];

function createInitialPlayers(count: number, useBots: boolean): Player[] {
  const list: Player[] = [];
  for (let i = 0; i < count; i++) {
    const isBot = i > 0 && useBots;
    list.push({
      id: i + 1,
      name: isBot ? `Bot AI ${i}` : `Người chơi ${i + 1}`,
      isAi: isBot,
      avatar: AVATARS[i % AVATARS.length],
      scorecard: createEmptyScorecard(),
    });
  }
  return list;
}

export function DiceGame() {
  const [playerCount, setPlayerCount] = useState<number>(2);
  const [useBots, setUseBots] = useState<boolean>(true);
  const [players, setPlayers] = useState<Player[]>(() => createInitialPlayers(2, true));
  const [activeIdx, setActiveIdx] = useState<number>(0);

  const [dice, setDice] = useState<number[]>([1, 2, 3, 4, 5]);
  const [held, setHeld] = useState<boolean[]>([false, false, false, false, false]);
  const [rollsLeft, setRollsLeft] = useState<number>(3);
  const [isRolling, setIsRolling] = useState<boolean>(false);

  const [gameStarted, setGameStarted] = useState<boolean>(true);
  const [gameFinished, setGameFinished] = useState<boolean>(false);

  // Khởi tạo ván chơi
  const startNewGame = useCallback(() => {
    const newPlayers: Player[] = [];
    for (let i = 0; i < playerCount; i++) {
      const isBot = i > 0 && useBots;
      newPlayers.push({
        id: i + 1,
        name: isBot ? `Bot AI ${i}` : `Người chơi ${i + 1}`,
        isAi: isBot,
        avatar: AVATARS[i % AVATARS.length],
        scorecard: createEmptyScorecard(),
      });
    }
    setPlayers(newPlayers);
    setActiveIdx(0);
    setDice([1, 2, 3, 4, 5]);
    setHeld([false, false, false, false, false]);
    setRollsLeft(3);
    setIsRolling(false);
    setGameStarted(true);
    setGameFinished(false);
  }, [playerCount, useBots]);

  // Tự động khởi tạo ngay khi mở trang
  useEffect(() => {
    if (players.length === 0) {
      startNewGame();
    }
  }, [players.length, startNewGame]);

  // Đổi lượt chơi
  const nextTurn = useCallback(
    (updatedPlayers: Player[]) => {
      const allDone = updatedPlayers.every((p) =>
        Object.values(p.scorecard).every((val) => val !== null)
      );

      if (allDone) {
        setGameFinished(true);
        playSound("win");
        return;
      }

      const nextIdx = (activeIdx + 1) % updatedPlayers.length;
      setActiveIdx(nextIdx);
      setDice([1, 2, 3, 4, 5]);
      setHeld([false, false, false, false, false]);
      setRollsLeft(3);
    },
    [activeIdx]
  );

  // Lắc xúc xắc (Hỗ trợ customHeld cho lượt của Bot AI)
  const rollDice = useCallback(
    (customHeld?: boolean[]) => {
      if (rollsLeft <= 0 || isRolling) return;
      setIsRolling(true);
      playSound("move");

      const activeHeld = customHeld ?? held;

      let count = 0;
      const interval = setInterval(() => {
        setDice((prev) =>
          prev.map((val, idx) => (activeHeld[idx] ? val : Math.floor(Math.random() * 6) + 1))
        );
        count++;
        if (count > 6) {
          clearInterval(interval);
          setIsRolling(false);
          setRollsLeft((r) => r - 1);
        }
      }, 60);
    },
    [held, isRolling, rollsLeft]
  );

  // Giữ/Thả viên xúc xắc
  const toggleHold = (idx: number) => {
    if (rollsLeft === 3 || isRolling || gameFinished) return;
    setHeld((prev) => {
      const next = [...prev];
      next[idx] = !next[idx];
      return next;
    });
  };

  // Chọn điền điểm vào ô
  const selectCategory = (cat: Category) => {
    if (rollsLeft === 3 || isRolling || gameFinished) return;
    const currPlayer = players[activeIdx];
    if (!currPlayer || currPlayer.scorecard[cat] !== null) return;

    const scoreVal = calculateScore(cat, dice);
    playSound("click");

    const updatedPlayers = players.map((p, idx) => {
      if (idx !== activeIdx) return p;
      return {
        ...p,
        scorecard: {
          ...p.scorecard,
          [cat]: scoreVal,
        },
      };
    });

    setPlayers(updatedPlayers);
    nextTurn(updatedPlayers);
  };

  // Bot AI logic tự động chơi
  useEffect(() => {
    if (!gameStarted || gameFinished || isRolling) return;
    const currPlayer = players[activeIdx];
    if (!currPlayer || !currPlayer.isAi) return;

    if (rollsLeft === 3) {
      const timer = setTimeout(() => rollDice(), 600);
      return () => clearTimeout(timer);
    }

    if (rollsLeft > 0) {
      const timer = setTimeout(() => {
        const counts: Record<number, number> = {};
        dice.forEach((d) => (counts[d] = (counts[d] || 0) + 1));
        const bestVal = Number(
          Object.keys(counts).reduce((a, b) => (counts[Number(a)] > counts[Number(b)] ? a : b), "1")
        );

        const newHeld = dice.map((d) => d === bestVal);
        setHeld(newHeld);
        rollDice(newHeld);
      }, 800);
      return () => clearTimeout(timer);
    }

    if (rollsLeft === 0) {
      const timer = setTimeout(() => {
        const availableCats = CATEGORIES.filter((c) => currPlayer.scorecard[c.key] === null);
        if (availableCats.length === 0) return;

        let bestCat = availableCats[0].key;
        let maxScore = -1;

        for (const c of availableCats) {
          const sc = calculateScore(c.key, dice);
          if (sc > maxScore) {
            maxScore = sc;
            bestCat = c.key;
          }
        }
        selectCategory(bestCat);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [activeIdx, dice, gameFinished, gameStarted, isRolling, players, rollDice, rollsLeft]);

  // Render mặt xúc xắc 3D chân thực vỏ ngoài trắng, tất cả hột màu đen
  const renderDiceDot = (val: number) => {
    const dotBg = "bg-black shadow-inner";
    const dotSize = "w-3 h-3";

    // Vị trí phần trăm (x, y) cho từng mặt 1-6
    const positions: Record<number, { x: string; y: string }[]> = {
      1: [{ x: "50%", y: "50%" }],
      2: [
        { x: "25%", y: "25%" },
        { x: "75%", y: "75%" },
      ],
      3: [
        { x: "25%", y: "25%" },
        { x: "50%", y: "50%" },
        { x: "75%", y: "75%" },
      ],
      4: [
        { x: "25%", y: "25%" },
        { x: "75%", y: "25%" },
        { x: "25%", y: "75%" },
        { x: "75%", y: "75%" },
      ],
      5: [
        { x: "25%", y: "25%" },
        { x: "75%", y: "25%" },
        { x: "50%", y: "50%" },
        { x: "25%", y: "75%" },
        { x: "75%", y: "75%" },
      ],
      6: [
        { x: "25%", y: "20%" },
        { x: "75%", y: "20%" },
        { x: "25%", y: "50%" },
        { x: "75%", y: "50%" },
        { x: "25%", y: "80%" },
        { x: "75%", y: "80%" },
      ],
    };

    const dots = positions[val] || positions[1];

    return (
      <div className="relative h-14 w-14 rounded-2xl bg-white shadow-inner border border-slate-200">
        {dots.map((pos, i) => (
          <span
            key={i}
            style={{
              left: pos.x,
              top: pos.y,
              transform: "translate(-50%, -50%)",
            }}
            className={`absolute rounded-full ${dotBg} ${dotSize}`}
          />
        ))}
      </div>
    );
  };

  const activePlayer = players[activeIdx];

  return (
    <div className="flex w-full max-w-6xl flex-col items-center gap-6 px-4 py-6">
      {/* Top Header Navigation */}
      <div className="flex w-full items-center justify-between">
        <GameBackButton />
        {gameStarted && (
          <button
            onClick={() => setGameStarted(false)}
            type="button"
            className="flex items-center gap-1.5 rounded-xl border border-border bg-surface px-3 py-1.5 text-xs font-semibold text-muted hover:text-foreground"
          >
            <RotateCcw size={14} /> Cấu hình / Số người chơi
          </button>
        )}
      </div>

      {!gameStarted ? (
        /* Setup Screen Modal */
        <div className="flex w-full max-w-md flex-col items-center gap-6 rounded-2xl border border-border bg-surface p-6 sm:p-8">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-400/10 text-amber-400">
            <Dices size={36} />
          </div>
          <div className="text-center">
            <h1 className="font-display text-2xl font-bold text-foreground">Yahtzee (Lắc 5 Xúc Xắc)</h1>
            <p className="mt-1 text-sm text-muted">
              Lắc xúc xắc, chọn ô điểm chiến thuật và đọ tổng điểm qua 13 vòng đấu!
            </p>
          </div>

          <div className="w-full space-y-4">
            <div>
              <label className="text-sm font-medium text-muted">Số người chơi:</label>
              <div className="mt-2 grid grid-cols-3 gap-2">
                {[2, 3, 4].map((num) => (
                  <button
                    key={num}
                    onClick={() => setPlayerCount(num)}
                    type="button"
                    className={`rounded-xl border py-2.5 text-sm font-semibold transition ${
                      playerCount === num
                        ? "border-amber-400 bg-amber-400/10 text-amber-400"
                        : "border-border bg-surface-hover text-muted hover:border-border-hover"
                    }`}
                  >
                    {num} Người
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-muted">Chế độ đối thủ:</label>
              <div className="mt-2 grid grid-cols-2 gap-2">
                <button
                  onClick={() => setUseBots(true)}
                  type="button"
                  className={`flex items-center justify-center gap-2 rounded-xl border py-2.5 text-sm font-medium transition ${
                    useBots
                      ? "border-amber-400 bg-amber-400/10 text-amber-400"
                      : "border-border bg-surface-hover text-muted hover:border-border-hover"
                  }`}
                >
                  <Bot size={16} /> Đấu với Bot AI
                </button>
                <button
                  onClick={() => setUseBots(false)}
                  type="button"
                  className={`flex items-center justify-center gap-2 rounded-xl border py-2.5 text-sm font-medium transition ${
                    !useBots
                      ? "border-amber-400 bg-amber-400/10 text-amber-400"
                      : "border-border bg-surface-hover text-muted hover:border-border-hover"
                  }`}
                >
                  <User size={16} /> Bạn bè (Cùng máy)
                </button>
              </div>
            </div>
          </div>

          <button
            onClick={startNewGame}
            type="button"
            className="mt-2 w-full rounded-xl bg-amber-400 py-3 font-semibold text-ink-950 transition hover:bg-amber-500 active:scale-[0.98]"
          >
            Bắt đầu chơi ngay 🎲
          </button>
        </div>
      ) : (
        /* Main Game Layout - Side by Side (Left: Sticky Dice, Right: Yahtzee Scorecard) */
        <div className="grid w-full grid-cols-1 gap-6 lg:grid-cols-12 items-start">
          {/* Left Side: Sticky Roll Area & Dice Controls */}
          <div className="flex flex-col gap-4 lg:col-span-5 lg:sticky lg:top-20">
            {/* Current Player Banner */}
            <div className="flex items-center justify-between rounded-2xl border border-amber-400/40 bg-amber-400/10 p-4 shadow-sm backdrop-blur-md">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-400/20 text-2xl shadow-inner">
                  {activePlayer?.avatar}
                </span>
                <div>
                  <h3 className="font-display font-bold text-foreground flex items-center gap-1.5">
                    {activePlayer?.name}{" "}
                    {activePlayer?.isAi && (
                      <span className="rounded bg-amber-400/20 px-1.5 py-0.5 text-[10px] text-amber-400 font-mono">
                        BOT AI
                      </span>
                    )}
                  </h3>
                  <p className="text-xs text-muted">
                    Lượt lắc còn lại: <span className="font-mono font-bold text-amber-400">{rollsLeft} / 3</span>
                  </p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-[11px] font-medium text-muted uppercase tracking-wider">TỔNG ĐIỂM</span>
                <p className="font-mono text-2xl font-extrabold text-amber-400">
                  {calculateTotalScore(activePlayer?.scorecard)}
                </p>
              </div>
            </div>

            {/* 5 3D Dice Display Box */}
            <div className="flex flex-col items-center gap-4 rounded-2xl border border-border bg-surface p-5 shadow-sm">
              <div className="flex flex-wrap justify-center gap-3 py-2">
                {dice.map((val, idx) => (
                  <motion.div
                    key={idx}
                    animate={
                      isRolling && !held[idx]
                        ? { rotate: [0, 90, 180, 270, 360], scale: [1, 1.15, 1] }
                        : { scale: held[idx] ? 1.06 : 1 }
                    }
                    transition={{ duration: 0.25 }}
                    onClick={() => toggleHold(idx)}
                    className={`relative flex h-16 w-16 cursor-pointer flex-col items-center justify-center rounded-2xl border-2 transition-all shadow-lg ${
                      held[idx]
                        ? "border-amber-400 bg-white ring-4 ring-amber-400 shadow-amber-400/30 scale-105"
                        : "border-slate-300 border-b-4 border-r-4 border-slate-400 bg-white hover:border-amber-400 hover:scale-105"
                    }`}
                  >
                    {renderDiceDot(val)}
                    {held[idx] && (
                      <span className="absolute -top-2.5 rounded-md bg-amber-400 px-2 py-0.5 text-[10px] font-extrabold text-ink-950 shadow-md tracking-wider">
                        GIỮ
                      </span>
                    )}
                  </motion.div>
                ))}
              </div>

              <p className="text-center text-xs text-muted leading-relaxed">
                {rollsLeft === 3
                  ? "Bấm nút 'Lắc xúc xắc' bên dưới để bắt đầu."
                  : rollsLeft > 0
                  ? "Bấm chọn các viên xúc xắc bạn muốn Giữ (Hold) lại."
                  : "Đã hết lượt lắc! Chọn 1 ô bên Bảng Điểm bên phải để chốt điểm."}
              </p>

              <button
                onClick={() => rollDice()}
                disabled={rollsLeft <= 0 || isRolling || activePlayer?.isAi}
                type="button"
                className={`flex w-full items-center justify-center gap-2 rounded-xl py-3 font-bold transition shadow-md ${
                  rollsLeft > 0 && !isRolling && !activePlayer?.isAi
                    ? "bg-amber-400 text-ink-950 hover:bg-amber-500 active:scale-[0.98]"
                    : "cursor-not-allowed bg-surface-hover text-muted opacity-50"
                }`}
              >
                <Dices size={20} />
                <span>{isRolling ? "Đang lắc xí ngầu..." : `Lắc xúc xắc (${rollsLeft} lượt)`}</span>
              </button>
            </div>
          </div>

          {/* Right Side: Yahtzee Scorecard Sheet */}
          <div className="flex flex-col gap-3 lg:col-span-7">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-base font-bold text-foreground flex items-center gap-2">
                📋 Bảng Ghi Điểm Yahtzee
              </h2>
              <span className="text-xs text-amber-400 font-medium">Bấm +[Điểm] để chọn ô</span>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-border bg-surface p-3 shadow-sm">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-border text-muted">
                    <th className="pb-2 font-semibold text-foreground">Danh mục</th>
                    {players.map((p, idx) => (
                      <th
                        key={p.id}
                        className={`pb-2 text-center font-bold ${
                          idx === activeIdx ? "text-amber-400 font-extrabold" : "text-foreground"
                        }`}
                      >
                        {p.avatar} {p.name.slice(0, 9)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {/* Upper Section */}
                  <tr className="bg-surface-hover/40 text-[10px] font-bold text-muted uppercase tracking-wider">
                    <td colSpan={players.length + 1} className="py-1 px-1.5">
                      Phần Trên (1 - 6)
                    </td>
                  </tr>

                  {CATEGORIES.filter((c) => c.section === "upper").map((cat) => (
                    <tr key={cat.key} className="hover:bg-surface-hover/50 transition-colors">
                      <td className="py-1.5 pr-2">
                        <p className="font-semibold text-foreground leading-tight">{cat.label}</p>
                        <p className="text-[10px] text-muted">{cat.desc}</p>
                      </td>
                      {players.map((p, pIdx) => {
                        const score = p?.scorecard?.[cat.key] ?? null;
                        const isActive = pIdx === activeIdx;
                        const potential = isActive && rollsLeft < 3 ? calculateScore(cat.key, dice) : null;

                        return (
                          <td key={p.id} className="text-center py-1 px-1">
                            {score !== null ? (
                              <span className="font-mono font-bold text-foreground">{score}</span>
                            ) : isActive && !p.isAi && rollsLeft < 3 ? (
                              <button
                                onClick={() => selectCategory(cat.key)}
                                type="button"
                                className="w-full rounded-lg border border-amber-400/50 bg-amber-400/10 py-1 font-mono font-bold text-amber-400 transition hover:bg-amber-400 hover:text-ink-950 shadow-sm"
                              >
                                +{potential}
                              </button>
                            ) : (
                              <span className="text-muted/30">—</span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}

                  {/* Upper Bonus */}
                  <tr className="bg-surface-hover/40 font-semibold">
                    <td className="py-2 font-medium text-foreground">
                      Thưởng Phần Trên (≥63đ = +35đ)
                    </td>
                    {players.map((p) => (
                      <td key={p.id} className="text-center font-mono text-amber-400 font-bold">
                        +{calculateUpperBonus(p.scorecard)}
                      </td>
                    ))}
                  </tr>

                  {/* Lower Section */}
                  <tr className="bg-surface-hover/40 text-[10px] font-bold text-muted uppercase tracking-wider">
                    <td colSpan={players.length + 1} className="py-1 px-1.5">
                      Phần Dưới (Tổ hợp đặc biệt)
                    </td>
                  </tr>

                  {CATEGORIES.filter((c) => c.section === "lower").map((cat) => (
                    <tr key={cat.key} className="hover:bg-surface-hover/50 transition-colors">
                      <td className="py-1.5 pr-2">
                        <p className="font-semibold text-foreground leading-tight">{cat.label}</p>
                        <p className="text-[10px] text-muted">{cat.desc}</p>
                      </td>
                      {players.map((p, pIdx) => {
                        const score = p?.scorecard?.[cat.key] ?? null;
                        const isActive = pIdx === activeIdx;
                        const potential = isActive && rollsLeft < 3 ? calculateScore(cat.key, dice) : null;

                        return (
                          <td key={p.id} className="text-center py-1 px-1">
                            {score !== null ? (
                              <span className="font-mono font-bold text-foreground">{score}</span>
                            ) : isActive && !p.isAi && rollsLeft < 3 ? (
                              <button
                                onClick={() => selectCategory(cat.key)}
                                type="button"
                                className="w-full rounded-lg border border-amber-400/50 bg-amber-400/10 py-1 font-mono font-bold text-amber-400 transition hover:bg-amber-400 hover:text-ink-950 shadow-sm"
                              >
                                +{potential}
                              </button>
                            ) : (
                              <span className="text-muted/30">—</span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}

                  {/* Total Score */}
                  <tr className="border-t-2 border-amber-400/50 bg-amber-400/10 font-bold text-foreground">
                    <td className="py-2.5 font-display text-sm text-amber-400">TỔNG ĐIỂM</td>
                    {players.map((p) => (
                      <td key={p.id} className="text-center font-mono text-base font-extrabold text-amber-400">
                        {calculateTotalScore(p.scorecard)}
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Game Finish Winner Modal */}
      <AnimatePresence>
        {gameFinished && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="flex w-full max-w-md flex-col items-center rounded-2xl border border-amber-400/50 bg-surface p-6 text-center shadow-2xl"
            >
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-amber-400/20 text-amber-400">
                <Trophy size={36} />
              </div>
              <h2 className="mt-4 font-display text-2xl font-bold text-foreground">
                Kết Thúc Trận Đấu!
              </h2>

              <div className="mt-4 w-full space-y-2">
                {[...players]
                  .sort((a, b) => calculateTotalScore(b.scorecard) - calculateTotalScore(a.scorecard))
                  .map((p, rank) => (
                    <div
                      key={p.id}
                      className={`flex items-center justify-between rounded-xl p-3 ${
                        rank === 0
                          ? "border border-amber-400/50 bg-amber-400/10 font-bold"
                          : "bg-surface-hover"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm">{rank === 0 ? "🥇" : rank === 1 ? "🥈" : "🥉"}</span>
                        <span>{p.name}</span>
                      </div>
                      <span className="font-mono font-bold text-amber-400">
                        {calculateTotalScore(p.scorecard)} điểm
                      </span>
                    </div>
                  ))}
              </div>

              <button
                onClick={startNewGame}
                type="button"
                className="mt-6 w-full rounded-xl bg-amber-400 py-3 font-bold text-ink-950 transition hover:bg-amber-500 active:scale-[0.98]"
              >
                Chơi ván mới 🎲
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
