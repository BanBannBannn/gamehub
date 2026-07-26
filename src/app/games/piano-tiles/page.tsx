import { Header } from "@/components/game-shell/Header";
import { Footer } from "@/components/game-shell/Footer";
import { PianoTilesGame } from "@/games/piano-tiles/components/PianoTilesGame";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Game Đánh Đàn Piano Tiles - GameHub",
  description: "Trò chơi Đánh Đàn Piano Tiles Hero thuộc thể loại Âm Nhạc / Tiết Tấu (Music & Rhythm) lướt phím piano 60fps sướng tai.",
};

export default function PianoTilesPage() {
  return (
    <>
      <Header />
      <main className="flex flex-1 flex-col items-center justify-start min-h-[calc(100vh-140px)] bg-slate-950">
        <PianoTilesGame />
      </main>
      <Footer />
    </>
  );
}
