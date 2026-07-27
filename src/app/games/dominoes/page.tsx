import { Header } from "@/components/game-shell/Header";
import { Footer } from "@/components/game-shell/Footer";
import { DominoesGame } from "@/games/dominoes/components/DominoesGame";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Game Đô-mi-nô Dominoes Match - GameHub",
  description: "Trò chơi Đô-mi-nô Dominoes Match phong cách Ceramic Soft Pastel dịu mát với chế độ ghép quân đấu Bot AI.",
};

export default function DominoesPage() {
  return (
    <>
      <Header />
      <main className="flex flex-1 flex-col items-center justify-start min-h-[calc(100vh-140px)] bg-emerald-950/20">
        <DominoesGame />
      </main>
      <Footer />
    </>
  );
}
