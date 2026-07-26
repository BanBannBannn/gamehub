import { Header } from "@/components/game-shell/Header";
import { Footer } from "@/components/game-shell/Footer";
import { FlappyGame } from "@/games/flappy/components/FlappyGame";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Flappy Bird Arcade - GameHub",
  description: "Game Flappy Bird vỗ cánh vượt chướng ngại vật mượt mà 60fps với hiệu ứng đồ họa retro hiện đại.",
};

export default function FlappyPage() {
  return (
    <>
      <Header />
      <main className="flex flex-1 flex-col items-center justify-start min-h-[calc(100vh-140px)]">
        <FlappyGame />
      </main>
      <Footer />
    </>
  );
}
