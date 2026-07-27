import { Header } from "@/components/game-shell/Header";
import { Footer } from "@/components/game-shell/Footer";
import { TriviaQuizGame } from "@/games/trivia-quiz/components/TriviaQuizGame";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Game Đố Vui Trí Tuệ Trivia Quiz - GameHub",
  description: "Trò chơi Đố Vui Trí Tuệ Trivia Quiz thuộc thể loại Giáo Dục (Educational & Trivia) thử thách vốn hiểu biết địa lý, lịch sử và khoa học.",
};

export default function TriviaQuizPage() {
  return (
    <>
      <Header />
      <main className="flex flex-1 flex-col items-center justify-start min-h-[calc(100vh-140px)] bg-slate-950">
        <TriviaQuizGame />
      </main>
      <Footer />
    </>
  );
}
