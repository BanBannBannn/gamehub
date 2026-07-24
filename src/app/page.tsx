import { Header } from "@/components/game-shell/Header";
import { AmbientSudokuGrid } from "@/components/landing/AmbientSudokuGrid";
import { GameCard } from "@/components/landing/GameCard";
import { Grid3x3, Puzzle, Grid2x2, Hash, Bomb, Crown, Spade, Club, Swords, Grid, Circle } from "lucide-react";

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

          <div className="flex flex-col gap-12">
            {/* Cờ */}
            <div>
              <h3 className="mb-4 font-display text-xl font-semibold text-foreground flex items-center gap-2">
                <span className="text-amber-400">♟️</span> Board Games (Cờ)
              </h3>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <GameCard
                  href="/games/chess"
                  title="Cờ Vua (Chess)"
                  description="Môn thể thao trí tuệ với luật chơi quốc tế. Chơi 2 người trên cùng thiết bị."
                  icon={<Crown size={22} />}
                  accent="#8b7cf6"
                  badge="Mới"
                  tag="Cờ"
                />
                <GameCard
                  href="/games/xiangqi"
                  title="Cờ Tướng"
                  description="Cờ Tướng truyền thống (Xiangqi). Chơi 2 người trên cùng thiết bị."
                  icon={<Crown size={22} />}
                  accent="#ef4444"
                  badge="Mới"
                  tag="Cờ"
                />
                <GameCard
                  href="/games/caro"
                  title="Caro"
                  description="Cờ ca-rô 15x15 — chơi với máy hoặc rủ bạn chơi cùng."
                  icon={<Grid2x2 size={22} />}
                  accent="#4fd1c5"
                  tag="Cờ"
                />
                <GameCard
                  href="/games/connect4"
                  title="Bốn quân"
                  description="Thả quân nối 4 (Connect Four). Chơi 2 người, với máy, hoặc online."
                  icon={<Grid2x2 size={22} />}
                  accent="#1d4ed8"
                  badge="Mới"
                  tag="Cờ"
                />
                <GameCard
                  href="/games/reversi"
                  title="Cờ lật (Reversi)"
                  description="Kẹp và lật quân đối phương (Othello). Chơi 2 người hoặc với máy."
                  icon={<Circle size={22} />}
                  accent="#166534"
                  badge="Mới"
                  tag="Cờ"
                />
              </div>
            </div>

            {/* Game Bài */}
            <div>
              <h3 className="mb-4 font-display text-xl font-semibold text-foreground flex items-center gap-2">
                <span className="text-coral-500">🃏</span> Card Games (Game Bài)
              </h3>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <GameCard
                  title="Tiến lên miền Nam"
                  description="Game bài quen thuộc của người Việt. Sắp ra mắt chế độ đánh với máy."
                  icon={<Spade size={22} />}
                  accent="#e8615c"
                  tag="Bài"
                  comingSoon
                />
                <GameCard
                  href="/games/solitaire"
                  title="Solitaire"
                  description="Xếp bài cổ điển rèn luyện tính kiên nhẫn. Thử thách tài chiến lược của bạn."
                  icon={<Club size={22} />}
                  accent="#f2b84b"
                  badge="Mới"
                  tag="Bài"
                />
              </div>
            </div>

            {/* Giải đố & Logic */}
            <div>
              <h3 className="mb-4 font-display text-xl font-semibold text-foreground flex items-center gap-2">
                <span className="text-teal-400">🧩</span> Giải Đố & Logic
              </h3>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <GameCard
                  href="/games/sudoku"
                  title="Sudoku"
                  description="Điền số 1-9 sao cho không trùng hàng, cột và khối 3x3. Có gợi ý thông minh."
                  icon={<Grid3x3 size={22} />}
                  accent="#f2b84b"
                  tag="Giải đố"
                />
                <GameCard
                  href="/games/minesweeper"
                  title="Dò mìn"
                  description="Suy luận logic để mở hết ô an toàn, tránh xa những quả mìn."
                  icon={<Bomb size={22} />}
                  accent="#e8615c"
                  tag="Logic"
                />
                <GameCard
                  href="/games/memory"
                  title="Lật hình ghép cặp"
                  description="Rèn trí nhớ — lật 2 lá giống nhau để ghép cặp, hoàn thành với ít lượt nhất."
                  icon={<Puzzle size={22} />}
                  accent="#8b7cf6"
                  badge="Mới"
                  tag="Giải đố"
                />
                <GameCard
                  href="/games/doanso"
                  title="Đoán số"
                  description="Suy luận logic để tìm ra con số bí ẩn trong ít lượt nhất."
                  icon={<Hash size={22} />}
                  accent="#8b7cf6"
                  badge="Mới"
                  tag="Logic"
                />
                <GameCard
                  href="/games/2048"
                  title="2048"
                  description="Gộp các ô cùng số để đạt tới ô 2048. Chơi bằng phím mũi tên hoặc vuốt."
                  icon={<Grid size={22} />}
                  accent="#edc22e"
                  badge="Mới"
                  tag="Logic"
                />
              </div>
            </div>
          </div>
        </section>
      </main>
      <footer className="border-t border-border py-6 text-center text-xs text-ink-600">
        GameHub — xây dựng với Next.js &amp; Supabase.
      </footer>
    </>
  );
}
