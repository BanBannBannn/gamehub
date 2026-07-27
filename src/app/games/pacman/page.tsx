import { Header } from "@/components/game-shell/Header";
import { Footer } from "@/components/game-shell/Footer";
import { PacmanGame } from "@/games/pacman/components/PacmanGame";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Game Pac-Man Neon Maze - GameHub",
  description: "Trò chơi Pac-Man ăn chấm vàng huyền thoại trong mê cung Neon với con ma AI săn đuổi và viên siêu năng lượng.",
};

export default function PacmanPage() {
  return (
    <>
      <Header />
      <main className="flex flex-1 flex-col items-center justify-start min-h-[calc(100vh-140px)] bg-slate-950">
        <PacmanGame />
      </main>
      <Footer />
    </>
  );
}
