import { Header } from "@/components/game-shell/Header";
import { Footer } from "@/components/game-shell/Footer";
import { ConnectDotsGame } from "@/games/connect-dots/components/ConnectDotsGame";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Game Nối Điểm Dots & Boxes - GameHub",
  description: "Trò chơi Nối Điểm Dots & Boxes phong cách Soft Pastel Grid với chế độ chiếm ô đọ điểm đấu với Bot AI.",
};

export default function ConnectDotsPage() {
  return (
    <>
      <Header />
      <main className="flex flex-1 flex-col items-center justify-start min-h-[calc(100vh-140px)] bg-slate-100">
        <ConnectDotsGame />
      </main>
      <Footer />
    </>
  );
}
