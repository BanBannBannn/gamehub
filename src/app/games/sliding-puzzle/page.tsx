import { Header } from "@/components/game-shell/Header";
import { Footer } from "@/components/game-shell/Footer";
import { SlidingPuzzleGame } from "@/games/sliding-puzzle/components/SlidingPuzzleGame";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Game Xếp Hình Trượt 15-Puzzle - GameHub",
  description: "Trò chơi Xếp hình trượt ô số 15-Puzzle cổ điển với chế độ 3x3 và 4x4, đếm nước đi và thời gian giải đố.",
};

export default function SlidingPuzzlePage() {
  return (
    <>
      <Header />
      <main className="flex flex-1 flex-col items-center justify-start min-h-[calc(100vh-140px)] bg-slate-950">
        <SlidingPuzzleGame />
      </main>
      <Footer />
    </>
  );
}
