import { Header } from "@/components/game-shell/Header";
import { Footer } from "@/components/game-shell/Footer";
import { SpaceInvadersGame } from "@/games/space-invaders/components/SpaceInvadersGame";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Game Space Invaders Neon - GameHub",
  description: "Trò chơi Bắn Đĩa Bay Space Invaders huyền thoại phong cách Cyberpunk Neon với âm thanh súng laser sướng tai.",
};

export default function SpaceInvadersPage() {
  return (
    <>
      <Header />
      <main className="flex flex-1 flex-col items-center justify-start min-h-[calc(100vh-140px)] bg-slate-950">
        <SpaceInvadersGame />
      </main>
      <Footer />
    </>
  );
}
