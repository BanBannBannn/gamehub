import type { Metadata } from "next";
import { Header } from "@/components/game-shell/Header";
import { CaroGame } from "@/games/caro/components/CaroGame";

export const metadata: Metadata = {
  title: "Caro",
  description: "Chơi Caro (cờ ca-rô) 15x15 với máy hoặc rủ bạn chơi cùng, có gợi ý nước đi thông minh.",
};

export default function CaroPage() {
  return (
    <>
      <Header />
      <main className="flex flex-1 flex-col">
        <CaroGame />
      </main>
    </>
  );
}
