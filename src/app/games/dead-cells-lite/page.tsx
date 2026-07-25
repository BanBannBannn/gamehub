import type { Metadata } from "next";
import { Header } from "@/components/game-shell/Header";
import { DeadCellsGame } from "@/games/dead-cells-lite/components/DeadCellsGame";

export const metadata: Metadata = {
  title: "Dead Cells Lite",
  description: "Roguelike hành động 2D lấy cảm hứng từ Dead Cells — đi cảnh, chiến đấu, mỗi lượt chơi một khác.",
};

export default function DeadCellsLitePage() {
  return (
    <>
      <Header />
      <main className="flex flex-1 flex-col items-center px-4 py-8">
        <DeadCellsGame />
      </main>
    </>
  );
}
