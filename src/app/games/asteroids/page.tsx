import { Header } from "@/components/game-shell/Header";
import { Footer } from "@/components/game-shell/Footer";
import { AsteroidsGame } from "@/games/asteroids/components/AsteroidsGame";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Game Asteroids Arcade - GameHub",
  description: "Trò chơi Bắn Thiên Thạch Asteroids Vector Arcade 60fps phong cách Cyberpunk Neon với âm thanh súng laser sướng tai.",
};

export default function AsteroidsPage() {
  return (
    <>
      <Header />
      <main className="flex flex-1 flex-col items-center justify-start min-h-[calc(100vh-140px)] bg-slate-950">
        <AsteroidsGame />
      </main>
      <Footer />
    </>
  );
}
