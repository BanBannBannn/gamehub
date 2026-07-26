import { Header } from "@/components/game-shell/Header";
import { Footer } from "@/components/game-shell/Footer";
import { WordleGame } from "@/games/wordle/components/WordleGame";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Game Đoán Từ Wordle - GameHub",
  description: "Trò chơi đoán từ 5 chữ cái nổi tiếng với chế độ Tiếng Anh và Tiếng Việt.",
};

export default function WordlePage() {
  return (
    <>
      <Header />
      <main className="flex flex-1 flex-col items-center justify-start min-h-[calc(100vh-140px)]">
        <WordleGame />
      </main>
      <Footer />
    </>
  );
}
