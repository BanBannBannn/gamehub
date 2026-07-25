import type { Metadata } from "next";
import { Header } from "@/components/game-shell/Header";
import { ReversiGame } from "@/games/reversi/components/ReversiGame";

export const metadata: Metadata = {
  title: "Cờ lật (Reversi)",
  description: "Cờ lật / Othello — kẹp và lật quân đối phương, ai nhiều quân hơn khi hết bàn sẽ thắng.",
};

export default function ReversiPage() {
  return (
    <>
      <Header />
      <main className="flex flex-1 flex-col">
        <ReversiGame />
      </main>
    </>
  );
}
