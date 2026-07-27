import { Header } from "@/components/game-shell/Header";
import { Footer } from "@/components/game-shell/Footer";
import { PongGame } from "@/games/pong/components/PongGame";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Game Pong Cyber Arcade - GameHub",
  description: "Trò chơi Pong Arcade huyền thoại phong cách Cyberpunk Neon với chế độ 2 người chơi cùng máy và đấu với Bot AI.",
};

export default function PongPage() {
  return (
    <>
      <Header />
      <main className="flex flex-1 flex-col items-center justify-start min-h-[calc(100vh-140px)] bg-slate-950">
        <PongGame />
      </main>
      <Footer />
    </>
  );
}
