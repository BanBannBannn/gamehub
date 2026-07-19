import { Metadata } from "next";
import { Header } from "@/components/game-shell/Header";
import { XiangqiGame } from "@/games/xiangqi/components/XiangqiGame";

export const metadata: Metadata = {
  title: "Cờ Tướng - GameHub",
  description: "Chơi Cờ Tướng (Xiangqi) truyền thống 2 người chơi trên GameHub.",
};

export default function XiangqiPage() {
  return (
    <>
      <Header />
      <main className="flex flex-1 flex-col">
        <XiangqiGame />
      </main>
    </>
  );
}
