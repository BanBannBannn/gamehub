import { Header } from "@/components/game-shell/Header";
import { Footer } from "@/components/game-shell/Footer";
import { CyberRacerGame } from "@/games/cyber-racer/components/CyberRacerGame";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Game Đua Xe Cyber Racer - GameHub",
  description: "Trò chơi Đua xe Pixel Cyberpunk 60fps với các thử thách né xe ngược chiều và tăng tốc vượt quãng đường kỷ lục.",
};

export default function CyberRacerPage() {
  return (
    <>
      <Header />
      <main className="flex flex-1 flex-col items-center justify-start min-h-[calc(100vh-140px)] bg-slate-950">
        <CyberRacerGame />
      </main>
      <Footer />
    </>
  );
}
