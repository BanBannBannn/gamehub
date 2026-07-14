import type { Metadata } from "next";
import { Header } from "@/components/game-shell/Header";
import { SudokuGame } from "@/games/sudoku/components/SudokuGame";

export const metadata: Metadata = {
  title: "Sudoku",
  description: "Chơi Sudoku với gợi ý thông minh, lưu tiến trình offline, 3 độ khó.",
};

export default function SudokuPage() {
  return (
    <>
      <Header />
      <main className="flex flex-1 flex-col">
        <SudokuGame />
      </main>
    </>
  );
}
