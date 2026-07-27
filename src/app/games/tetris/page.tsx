import { Header } from "@/components/game-shell/Header";
import { Footer } from "@/components/game-shell/Footer";
import { TetrisGame } from "@/games/tetris/components/TetrisGame";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Game Xếp Gạch Tetris Neon - GameHub",
  description: "Trò chơi Xếp gạch Tetris phong cách Neon với 7 loại khối tiêu chuẩn, combo xóa hàng và âm thanh sướng tai.",
};

export default function TetrisPage() {
  return (
    <>
      <Header />
      <main className="flex flex-1 flex-col items-center justify-start min-h-[calc(100vh-140px)] bg-slate-950">
        <TetrisGame />
      </main>
      <Footer />
    </>
  );
}
