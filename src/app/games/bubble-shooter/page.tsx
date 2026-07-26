import { Header } from "@/components/game-shell/Header";
import { Footer } from "@/components/game-shell/Footer";
import { BubbleShooterGame } from "@/games/bubble-shooter/components/BubbleShooterGame";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Game Bắn Bóng Bubble Shooter - GameHub",
  description: "Trò chơi Bắn Bóng Bubble Shooter rực rỡ sắc màu với góc ngắm bắn chuẩn xác và âm thanh nổ bóng vui tai.",
};

export default function BubbleShooterPage() {
  return (
    <>
      <Header />
      <main className="flex flex-1 flex-col items-center justify-start min-h-[calc(100vh-140px)] bg-slate-950">
        <BubbleShooterGame />
      </main>
      <Footer />
    </>
  );
}
