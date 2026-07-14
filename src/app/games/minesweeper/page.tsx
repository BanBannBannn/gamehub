import type { Metadata } from "next";
import { Header } from "@/components/game-shell/Header";
import { MinesweeperGame } from "@/games/minesweeper/components/MinesweeperGame";

export const metadata: Metadata = {
  title: "Dò mìn",
  description: "Dò mìn (Minesweeper) - Suy luận logic để mở hết ô an toàn, tránh xa những quả mìn.",
};

export default function MinesweeperPage() {
  return (
    <>
      <Header />
      <main className="flex flex-1 flex-col">
        <MinesweeperGame />
      </main>
    </>
  );
}
