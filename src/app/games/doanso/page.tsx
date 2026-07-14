import type { Metadata } from "next";
import { Header } from "@/components/game-shell/Header";
import { DoansoGame } from "@/games/doanso/components/DoansoGame";

export const metadata: Metadata = {
  title: "Đoán số",
  description: "Suy luận logic để tìm ra dãy số bí ẩn trong ít lượt nhất, có gợi ý thông minh.",
};

export default function DoansoPage() {
  return (
    <>
      <Header />
      <main className="flex flex-1 flex-col">
        <DoansoGame />
      </main>
    </>
  );
}
