import { Header } from "@/components/game-shell/Header";
import { AmbientSudokuGrid } from "@/components/landing/AmbientSudokuGrid";
import { GameCard } from "@/components/landing/GameCard";
import { Grid3x3, Puzzle, Grid2x2, Hash } from "lucide-react";

export default function Home() {
  return (
    <>
      <Header />
      <main className="flex-1">
        <section className="relative overflow-hidden border-b border-border">
          <div className="ink-grid-bg absolute inset-0 pointer-events-none" />
          <div className="relative mx-auto grid max-w-6xl items-center gap-10 px-4 py-16 sm:px-6 sm:py-24 lg:grid-cols-2">
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-surface-hover px-3 py-1 text-xs font-medium text-amber-400">
                🧠 Game trí tuệ, hỗ trợ offline
              </span>
              <h1 className="mt-4 font-display text-4xl font-bold leading-tight text-foreground sm:text-5xl">
                Rèn tư duy mỗi ngày,
                <br />
                bắt đầu với Sudoku.
              </h1>
              <p className="mt-4 max-w-md text-base text-muted">
                GameHub là nơi tập hợp các game giải đố nhỏ gọn, giao diện đẹp,
                chạy mượt trên mọi thiết bị. Cài như một ứng dụng, chơi được
                cả khi không có mạng.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <a
                  href="/games/sudoku"
                  className="rounded-xl bg-amber-400 px-6 py-3 font-medium text-ink-950 transition hover:bg-amber-500 active:scale-[0.98]"
                >
                  Chơi Sudoku ngay
                </a>
                <a
                  href="#games"
                  className="rounded-xl border border-border-hover px-6 py-3 font-medium text-foreground transition hover:bg-surface-hover"
                >
                  Xem tất cả game
                </a>
              </div>
            </div>
            <div className="mx-auto aspect-square w-full max-w-sm opacity-90">
              <AmbientSudokuGrid />
            </div>
          </div>
        </section>

        <section id="games" className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <div className="mb-8 flex items-end justify-between">
            <div>
              <h2 className="font-display text-2xl font-bold text-foreground">Thư viện game</h2>
              <p className="mt-1 text-sm text-muted">Sẽ có thêm nhiều game mới trong thời gian tới.</p>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <GameCard
              href="/games/sudoku"
              title="Sudoku"
              description="Điền số 1-9 sao cho không trùng hàng, cột và khối 3x3. Có gợi ý thông minh."
              icon={<Grid3x3 size={22} />}
              accent="#f2b84b"
              badge="Mới"
            />
            <GameCard
              href="/games/caro"
              title="Caro"
              description="Cờ ca-rô 15x15 — chơi với máy hoặc rủ bạn chơi cùng."
              icon={<Grid2x2 size={22} />}
              accent="#4fd1c5"
              badge="Mới"
            />
            <GameCard
              title="Ô chữ"
              description="Giải ô chữ chủ đề đa dạng, luyện từ vựng mỗi ngày."
              icon={<Puzzle size={22} />}
              accent="#e8615c"
              comingSoon
            />
            <GameCard
              title="Đoán số"
              description="Suy luận logic để tìm ra con số bí ẩn trong ít lượt nhất."
              icon={<Hash size={22} />}
              accent="#8b7cf6"
              comingSoon
            />
          </div>
        </section>
      </main>
      <footer className="border-t border-border py-6 text-center text-xs text-ink-600">
        GameHub — xây dựng với Next.js &amp; Supabase.
      </footer>
    </>
  );
}
