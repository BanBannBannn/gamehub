import { Header } from "@/components/game-shell/Header";
import { Footer } from "@/components/game-shell/Footer";
import { ArcheryGame } from "@/games/archery/components/ArcheryGame";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Game Bắn Cung Target Master - GameHub",
  description: "Trò chơi Bắn Cung Target Master ngắm bia hồng tâm với thử thách sức gió ngẫu nhiên và 5 lượt bắn tích điểm.",
};

export default function ArcheryPage() {
  return (
    <>
      <Header />
      <main className="flex flex-1 flex-col items-center justify-start min-h-[calc(100vh-140px)] bg-slate-950">
        <ArcheryGame />
      </main>
      <Footer />
    </>
  );
}
