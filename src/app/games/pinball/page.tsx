import { Header } from "@/components/game-shell/Header";
import { Footer } from "@/components/game-shell/Footer";
import { PinballGame } from "@/games/pinball/components/PinballGame";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Game Pinball Cyber Arcade - GameHub",
  description: "Trò chơi Đốt Pháo Pinball Arcade 60fps phong cách Cyberpunk Neon với cần gạt flipper và đệm nảy điểm số.",
};

export default function PinballPage() {
  return (
    <>
      <Header />
      <main className="flex flex-1 flex-col items-center justify-start min-h-[calc(100vh-140px)] bg-slate-950">
        <PinballGame />
      </main>
      <Footer />
    </>
  );
}
