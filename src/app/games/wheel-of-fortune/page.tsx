import { Header } from "@/components/game-shell/Header";
import { Footer } from "@/components/game-shell/Footer";
import { WheelOfFortuneGame } from "@/games/wheel-of-fortune/components/WheelOfFortuneGame";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Game Vòng Quay May Mắn Wheel of Fortune - GameHub",
  description: "Trò chơi Vòng Quay May Mắn Wheel of Fortune thuộc thể loại Party / May Mắn thử vận may trúng tiền thưởng lớn.",
};

export default function WheelOfFortunePage() {
  return (
    <>
      <Header />
      <main className="flex flex-1 flex-col items-center justify-start min-h-[calc(100vh-140px)] bg-slate-950">
        <WheelOfFortuneGame />
      </main>
      <Footer />
    </>
  );
}
