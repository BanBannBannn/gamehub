import type { Metadata } from "next";
import { Header } from "@/components/game-shell/Header";
import { MemoryGame } from "@/games/memory/components/MemoryGame";

export const metadata: Metadata = {
  title: "Lật hình ghép cặp",
  description: "Lật hình ghép cặp (Memory) — rèn trí nhớ, ghép hết các cặp giống nhau với ít lượt nhất.",
};

export default function MemoryPage() {
  return (
    <>
      <Header />
      <main className="flex flex-1 flex-col">
        <MemoryGame />
      </main>
    </>
  );
}
