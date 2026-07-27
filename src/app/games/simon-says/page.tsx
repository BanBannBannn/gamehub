import { Header } from "@/components/game-shell/Header";
import { Footer } from "@/components/game-shell/Footer";
import { SimonSaysGame } from "@/games/simon-says/components/SimonSaysGame";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Game Ghi Nhớ Giai Điệu Simon Says - GameHub",
  description: "Trò chơi Ghi Nhớ Giai Điệu Simon Says phong cách Vintage Retro Console thử thách trí nhớ âm thanh và màu sắc.",
};

export default function SimonSaysPage() {
  return (
    <>
      <Header />
      <main className="flex flex-1 flex-col items-center justify-start min-h-[calc(100vh-140px)] bg-slate-950">
        <SimonSaysGame />
      </main>
      <Footer />
    </>
  );
}
