import { Header } from "@/components/game-shell/Header";
import { Footer } from "@/components/game-shell/Footer";
import { SnakeGame } from "@/games/snake/components/SnakeGame";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Game Rắn Săn Mồi Cyber Neon - GameHub",
  description: "Trò chơi Rắn săn mồi phong cách Cyberpunk Neon với các loại thức ăn power-up và hiệu ứng vệt sáng neon.",
};

export default function SnakePage() {
  return (
    <>
      <Header />
      <main className="flex flex-1 flex-col items-center justify-start min-h-[calc(100vh-140px)] bg-slate-950">
        <SnakeGame />
      </main>
      <Footer />
    </>
  );
}
