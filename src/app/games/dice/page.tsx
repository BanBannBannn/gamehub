import { Header } from "@/components/game-shell/Header";
import { Footer } from "@/components/game-shell/Footer";
import { DiceGame } from "@/games/dice/components/DiceGame";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Lắc Xúc Xắc Yahtzee (2-4 Người) - GameHub",
  description: "Trò chơi Yahtzee lắc 5 xúc xắc ghi điểm 13 ô dành cho 2 đến 4 người chơi hoặc đấu với máy AI.",
};

export default function DicePage() {
  return (
    <>
      <Header />
      <main className="flex flex-1 flex-col items-center justify-start min-h-[calc(100vh-140px)]">
        <DiceGame />
      </main>
      <Footer />
    </>
  );
}
