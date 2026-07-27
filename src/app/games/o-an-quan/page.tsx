import { Header } from "@/components/game-shell/Header";
import { Footer } from "@/components/game-shell/Footer";
import { OAnQuanGame } from "@/games/o-an-quan/components/OAnQuanGame";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Game Ô Ăn Quan Gỗ Cổ Truyền - GameHub",
  description: "Trò chơi dân gian Ô Ăn Quan phong cách Gỗ mộc cổ truyền ấm áp với chế độ 2 người chơi và đấu với Bot AI.",
};

export default function OAnQuanPage() {
  return (
    <>
      <Header />
      <main className="flex flex-1 flex-col items-center justify-start min-h-[calc(100vh-140px)] bg-amber-950/90">
        <OAnQuanGame />
      </main>
      <Footer />
    </>
  );
}
