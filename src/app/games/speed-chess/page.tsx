import { Header } from "@/components/game-shell/Header";
import { Footer } from "@/components/game-shell/Footer";
import { SpeedChessGame } from "@/games/speed-chess/components/SpeedChessGame";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Game Cờ Vua Tốc Độ Speed Chess - GameHub",
  description: "Trò chơi Cờ Vua Tốc Độ Speed Chess Blitz 3 phút với đồng hồ đếm ngược kịch tính đọ trí với Bot AI.",
};

export default function SpeedChessPage() {
  return (
    <>
      <Header />
      <main className="flex flex-1 flex-col items-center justify-start min-h-[calc(100vh-140px)] bg-slate-950">
        <SpeedChessGame />
      </main>
      <Footer />
    </>
  );
}
