import { Header } from "@/components/game-shell/Header";
import { Footer } from "@/components/game-shell/Footer";
import { BlackjackGame } from "@/games/blackjack/components/BlackjackGame";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Game Xì Dách Blackjack 21 - GameHub",
  description: "Trò chơi Xì Dách Blackjack 21 Casino với rút bài chiến thuật, cược tiền chip và đọ điểm với Nhà cái.",
};

export default function BlackjackPage() {
  return (
    <>
      <Header />
      <main className="flex flex-1 flex-col items-center justify-start min-h-[calc(100vh-140px)] bg-slate-950">
        <BlackjackGame />
      </main>
      <Footer />
    </>
  );
}
