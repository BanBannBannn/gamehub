import { Header } from "@/components/game-shell/Header";
import { Footer } from "@/components/game-shell/Footer";
import { MahjongGame } from "@/games/mahjong/components/MahjongGame";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Game Mahjong Solitaire Cổ - GameHub",
  description: "Trò chơi ghép cặp thẻ Cờ Thẻ Mahjong Solitaire phong cách Ngọc Bích Emerald Antique Jade sang trọng.",
};

export default function MahjongPage() {
  return (
    <>
      <Header />
      <main className="flex flex-1 flex-col items-center justify-start min-h-[calc(100vh-140px)] bg-emerald-950/40">
        <MahjongGame />
      </main>
      <Footer />
    </>
  );
}
