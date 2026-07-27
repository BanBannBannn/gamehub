import { Header } from "@/components/game-shell/Header";
import { Footer } from "@/components/game-shell/Footer";
import { FruitCatcherGame } from "@/games/fruit-catcher/components/FruitCatcherGame";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Game Hứng Hoa Quả - GameHub",
  description: "Trò chơi Hứng Hoa Quả Cắt Slice sôi động với nhiều loại trái cây thơm ngon và những quả bom nguy hiểm.",
};

export default function FruitCatcherPage() {
  return (
    <>
      <Header />
      <main className="flex flex-1 flex-col items-center justify-start min-h-[calc(100vh-140px)] bg-slate-950">
        <FruitCatcherGame />
      </main>
      <Footer />
    </>
  );
}
