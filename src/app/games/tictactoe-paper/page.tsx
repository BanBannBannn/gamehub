import { Header } from "@/components/game-shell/Header";
import { Footer } from "@/components/game-shell/Footer";
import { PaperTicTacToeGame } from "@/games/tictactoe-paper/components/PaperTicTacToeGame";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Game Cờ Caro Giấy Tập Sổ Tay - GameHub",
  description: "Trò chơi Cờ Caro 3x3 Tic-Tac-Toe phong cách Giấy kẻ ngang nét chì sổ tay vintage với chế độ đấu 2 người và Bot AI.",
};

export default function PaperTicTacToePage() {
  return (
    <>
      <Header />
      <main className="flex flex-1 flex-col items-center justify-start min-h-[calc(100vh-140px)] bg-[#f5f0e6]">
        <PaperTicTacToeGame />
      </main>
      <Footer />
    </>
  );
}
