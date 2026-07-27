import { Header } from "@/components/game-shell/Header";
import { Footer } from "@/components/game-shell/Footer";
import { ReversiClassicGame } from "@/games/reversi-classic/components/ReversiClassicGame";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Game Cờ Lật Reversi Deluxe - GameHub",
  description: "Trò chơi Cờ Lật Reversi Othello phong cách Gỗ mộc thảm xanh rêu sang trọng với chế độ chơi 2 người và Bot AI.",
};

export default function ReversiClassicPage() {
  return (
    <>
      <Header />
      <main className="flex flex-1 flex-col items-center justify-start min-h-[calc(100vh-140px)] bg-emerald-950/60">
        <ReversiClassicGame />
      </main>
      <Footer />
    </>
  );
}
