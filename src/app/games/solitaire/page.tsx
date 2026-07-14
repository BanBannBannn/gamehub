import { Header } from "@/components/game-shell/Header";
import { SolitaireGame } from "@/games/solitaire/components/SolitaireGame";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Solitaire | GameHub",
  description: "Chơi Solitaire (Xếp bài nhện) miễn phí trên GameHub.",
};

export default function SolitairePage() {
  return (
    <>
      <Header />
      <main className="flex flex-1 flex-col">
        <SolitaireGame />
      </main>
    </>
  );
}
