import type { Metadata } from "next";
import { Header } from "@/components/game-shell/Header";
import { Connect4Game } from "@/games/connect4/components/Connect4Game";

export const metadata: Metadata = {
  title: "Bốn quân",
  description: "Bốn quân (Connect Four) — thả quân nối 4 để thắng. Chơi 2 người, với máy, hoặc online.",
};

export default function Connect4Page() {
  return (
    <>
      <Header />
      <main className="flex flex-1 flex-col">
        <Connect4Game />
      </main>
    </>
  );
}
