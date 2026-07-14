import { Metadata } from "next";
import { XiangqiGame } from "@/games/xiangqi/components/XiangqiGame";

export const metadata: Metadata = {
  title: "Cờ Tướng - GameHub",
  description: "Chơi Cờ Tướng (Xiangqi) truyền thống 2 người chơi trên GameHub.",
};

export default function XiangqiPage() {
  return <XiangqiGame />;
}
