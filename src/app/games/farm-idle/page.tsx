import { Header } from "@/components/game-shell/Header";
import { Footer } from "@/components/game-shell/Footer";
import { FarmIdleGame } from "@/games/farm-idle/components/FarmIdleGame";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Game Nông Trại Farm Idle Tycoon - GameHub",
  description: "Trò chơi Nông Trại Farm Idle Tycoon thuộc thể loại Mô Phỏng Quản Lý (Simulation & Management) tưới nước, trồng trọt và kinh doanh nông sản.",
};

export default function FarmIdlePage() {
  return (
    <>
      <Header />
      <main className="flex flex-1 flex-col items-center justify-start min-h-[calc(100vh-140px)] bg-emerald-950/30">
        <FarmIdleGame />
      </main>
      <Footer />
    </>
  );
}
