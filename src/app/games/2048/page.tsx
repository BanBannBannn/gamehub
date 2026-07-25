import type { Metadata } from "next";
import { Header } from "@/components/game-shell/Header";
import { Game2048 } from "@/games/2048/components/Game2048";

export const metadata: Metadata = {
  title: "2048",
  description: "2048 — gộp các ô cùng số để đạt tới ô 2048. Chơi bằng phím mũi tên hoặc vuốt.",
};

export default function Page2048() {
  return (
    <>
      <Header />
      <main className="flex flex-1 flex-col items-center px-4 py-8">
        <Game2048 />
      </main>
    </>
  );
}
