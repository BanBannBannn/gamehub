import type { Metadata } from "next";
import { Header } from "@/components/game-shell/Header";
import { ChessGame } from "@/games/chess/components/ChessGame";

export const metadata: Metadata = {
  title: "Cờ Vua (Chess)",
  description: "Trò chơi thể thao trí tuệ với luật chơi quốc tế. Chế độ 2 người chơi (Hotseat).",
};

export default function ChessPage() {
  return (
    <>
      <Header />
      <main className="flex flex-1 flex-col">
        <ChessGame />
      </main>
    </>
  );
}
