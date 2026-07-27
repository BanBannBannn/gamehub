import { Header } from "@/components/game-shell/Header";
import { Footer } from "@/components/game-shell/Footer";
import { BattleshipGame } from "@/games/battleship/components/BattleshipGame";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Game Thủy Chiến Battleship - GameHub",
  description: "Trò chơi Thủy Chiến Battleship chiến thuật với hạm đội tàu ngầm, bắn tên lửa tiêu diệt hạm đội Bot AI.",
};

export default function BattleshipPage() {
  return (
    <>
      <Header />
      <main className="flex flex-1 flex-col items-center justify-start min-h-[calc(100vh-140px)] bg-slate-950">
        <BattleshipGame />
      </main>
      <Footer />
    </>
  );
}
