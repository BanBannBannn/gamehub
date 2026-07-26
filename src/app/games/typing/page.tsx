import { Header } from "@/components/game-shell/Header";
import { Footer } from "@/components/game-shell/Footer";
import { TypingGame } from "@/games/typing/components/TypingGame";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Game Đánh Chữ Neon (Typing Strike) - GameHub",
  description: "Luyện gõ phím thần tốc giao diện Cyberpunk Neon với hiệu ứng particle burst, combo 5x/10x và đo chỉ số WPM real-time.",
};

export default function TypingPage() {
  return (
    <>
      <Header />
      <main className="flex flex-1 flex-col items-center justify-start min-h-[calc(100vh-140px)] bg-slate-950">
        <TypingGame />
      </main>
      <Footer />
    </>
  );
}
