import { Header } from "@/components/game-shell/Header";
import { Footer } from "@/components/game-shell/Footer";
import { AmbientSudokuGrid } from "@/components/landing/AmbientSudokuGrid";
import { GameCard } from "@/components/landing/GameCard";
import { Grid3x3, Puzzle, Grid2x2, Hash, Bomb, Crown, Spade, Club, Swords, Grid, Circle, Dices, Keyboard, Bird, SpellCheck, Zap, Boxes, Activity, Ghost, Rocket, Apple, CircleDot, Car, Sparkles, Anchor, Coins, Flame, LayoutGrid, Target, Sprout, PenTool, Gem, Radio, Music, Tractor, HelpCircle, Disc } from "lucide-react";

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
                <GameCard
                  href="/games/dice"
                  title="Lắc xúc xắc (Yahtzee)"
                  description="Game Yahtzee 2-4 người — lắc 5 xúc xắc 3D, chọn ô điểm 13 hàng chiến thuật."
                  icon={<Dices size={22} />}
                  accent="#f59e0b"
                  badge="Mới"
                  tag="Casual"
                />
                <GameCard
                  href="/games/typing"
                  title="Gõ phím thần tốc (Neon)"
                  description="Luyện tốc độ gõ phím Cyberpunk — hiệu ứng nổ hạt particle, combo 5x/10x, từ custom."
                  icon={<Keyboard size={22} />}
                  accent="#00f0ff"
                  badge="Neon"
                  tag="Arcade"
                />
                <GameCard
                  href="/games/wordle"
                  title="Đoán từ (Wordle)"
                  description="Đoán đúng từ 5 chữ cái trong 6 lượt thử — bàn phím phản hồi màu sắc, Tiếng Anh & Việt."
                  icon={<SpellCheck size={22} />}
                  accent="#10b981"
                  badge="Mới"
                  tag="Giải đố"
                />
                <GameCard
                  href="/games/snake"
                  title="Rắn săn mồi (Cyber)"
                  description="Game Rắn săn mồi cổ điển tái hiện đồ họa Cyberpunk Neon, thức ăn power-up X2 & Ghost."
                  icon={<Zap size={22} />}
                  accent="#3b82f6"
                  badge="Neon"
                  tag="Arcade"
                />
                <GameCard
                  href="/games/tetris"
                  title="Xếp gạch (Tetris)"
                  description="Xếp gạch Tetris Neon 60fps — 7 loại khối tiêu chuẩn, xoay/xả nhanh, xóa hàng ăn điểm."
                  icon={<Boxes size={22} />}
                  accent="#a855f7"
                  badge="Thử nghiệm"
                  tag="Arcade"
                />
                <GameCard
                  href="/games/pong"
                  title="Pong Arcade (Neon)"
                  description="Đón bóng Pong Retro 60fps — chế độ 2 người chơi cùng máy hoặc đối đầu với Bot AI."
                  icon={<Activity size={22} />}
                  accent="#ec4899"
                  badge="Thử nghiệm"
                  tag="Arcade"
                />
                <GameCard
                  href="/games/pacman"
                  title="Pac-Man (Neon)"
                  description="Ăn chấm vàng trong mê cung Neon — săn con ma AI và kích hoạt Siêu năng lượng."
                  icon={<Ghost size={22} />}
                  accent="#facc15"
                  badge="Thử nghiệm"
                  tag="Arcade"
                />
                <GameCard
                  href="/games/space-invaders"
                  title="Space Invaders (Neon)"
                  description="Bắn đĩa bay ngoài không gian 60fps — di chuyển phi thuyền, xả laser tiêu diệt người ngoài hành tinh."
                  icon={<Rocket size={22} />}
                  accent="#22c55e"
                  badge="Thử nghiệm"
                  tag="Arcade"
                />
                <GameCard
                  href="/games/fruit-catcher"
                  title="Hứng Hoa Quả (Slice)"
                  description="Hứng trái cây thơm ngon rơi từ trên cao — nhanh tay tích điểm và tránh né những quả bom nổ!"
                  icon={<Apple size={22} />}
                  accent="#f43f5e"
                  badge="Thử nghiệm"
                  tag="Arcade"
                />
                <GameCard
                  href="/games/bubble-shooter"
                  title="Bắn Bóng (Bubble Shooter)"
                  description="Bắn bóng màu sắc rực rỡ 60fps — căn góc ngắm pháo bắn nổ bóng tích điểm kỷ lục!"
                  icon={<CircleDot size={22} />}
                  accent="#10b981"
                  badge="Thử nghiệm"
                  tag="Arcade"
                />
                <GameCard
                  href="/games/cyber-racer"
                  title="Đua Xe (Cyber Racer)"
                  description="Đua xe Pixel Cyberpunk 60fps — né chướng ngại vật ngược chiều trên đường đua 3 làn tốc độ!"
                  icon={<Car size={22} />}
                  accent="#00f0ff"
                  badge="Thử nghiệm"
                  tag="Arcade"
                />
                <GameCard
                  href="/games/asteroids"
                  title="Bắn Thiên Thạch (Asteroids)"
                  description="Phi thuyền bắn thiên thạch 60fps — điều khiển xoay góc 360 độ và xả laser bắn nổ thiên thạch!"
                  icon={<Sparkles size={22} />}
                  accent="#facc15"
                  badge="Thử nghiệm"
                  tag="Arcade"
                />
                <GameCard
                  href="/games/battleship"
                  title="Thủy Chiến (Battleship)"
                  description="Bắn tên lửa tiêu diệt hạm đội tàu chiến Bot AI — xếp tàu hải chiến 8x8 đầy kịch tính!"
                  icon={<Anchor size={22} />}
                  accent="#3b82f6"
                  badge="Thử nghiệm"
                  tag="Chiến thuật"
                />
                <GameCard
                  href="/games/blackjack"
                  title="Xì Dách (Blackjack 21)"
                  description="Game bài Casino 21 — rút bài, dừng bài, cược tiền chip và đọ điểm sát 21 với Nhà cái!"
                  icon={<Coins size={22} />}
                  accent="#10b981"
                  badge="Thử nghiệm"
                  tag="Casual"
                />
                <GameCard
                  href="/games/pinball"
                  title="Đốt Pháo Pinball (Neon)"
                  description="Game Pinball Arcade 60fps — bắn bóng pinball, nảy bumper tích điểm kỷ lục!"
                  icon={<Flame size={22} />}
                  accent="#f43f5e"
                  badge="Thử nghiệm"
                  tag="Arcade"
                />
                <GameCard
                  href="/games/sliding-puzzle"
                  title="Xếp Hình Trượt (15-Puzzle)"
                  description="Game đố trượt 15-Puzzle 3x3 & 4x4 — trượt các ô số về đúng thứ tự trong thời gian ngắn nhất!"
                  icon={<LayoutGrid size={22} />}
                  accent="#facc15"
                  badge="Thử nghiệm"
                  tag="Giải đố"
                />
                <GameCard
                  href="/games/archery"
                  title="Bắn Cung (Archery Master)"
                  description="Bắn cung ngắm bia hồng tâm 60fps — căn lực giương dây cung, tính độ lệch gió đạt 100 điểm!"
                  icon={<Target size={22} />}
                  accent="#00f0ff"
                  badge="Thử nghiệm"
                  tag="Arcade"
                />
                <GameCard
                  href="/games/o-an-quan"
                  title="Ô Ăn Quan (Gỗ Cổ Truyền)"
                  description="Trò chơi dân gian Việt Nam — phong cách Gỗ mộc ấm áp, rải 10 sỏi dân ăn 2 sỏi quan đọ điểm với Bot AI!"
                  icon={<Sprout size={22} />}
                  accent="#d97706"
                  badge="Thử nghiệm"
                  tag="Dân gian"
                />
                <GameCard
                  href="/games/tictactoe-paper"
                  title="Caro Giấy Tập (Notebook)"
                  description="Cờ Caro 3x3 phong cách Sổ Tay Giấy Tập vintage — nét vẽ bút chì xanh đỏ mộc mạc hoài niệm!"
                  icon={<PenTool size={22} />}
                  accent="#2563eb"
                  badge="Thử nghiệm"
                  tag="Casual"
                />
                <GameCard
                  href="/games/dominoes"
                  title="Đô-mi-nô (Dominoes Match)"
                  description="Cờ Dominoes phong cách Pastel Soft Ceramic dịu mát — ghép quân bài cùng số đọ sức với Bot AI!"
                  icon={<Grid size={22} />}
                  accent="#059669"
                  badge="Thử nghiệm"
                  tag="Casual"
                />
                <GameCard
                  href="/games/mahjong"
                  title="Cờ Thẻ Mahjong (Solitaire)"
                  description="Ghép cặp thẻ Mahjong phong cách Ngọc Bích Emerald Jade sang trọng — ghép các cặp thẻ cùng hình!"
                  icon={<Gem size={22} />}
                  accent="#10b981"
                  badge="Thử nghiệm"
                  tag="Giải đố"
                />
                <GameCard
                  href="/games/connect-dots"
                  title="Nối Điểm (Dots & Boxes)"
                  description="Nối điểm khép ô 4x4 phong cách Soft Pastel Grid — nối đường thẳng để vây ô tích điểm đọ sức với AI!"
                  icon={<Circle size={22} />}
                  accent="#0284c7"
                  badge="Thử nghiệm"
                  tag="Giải đố"
                />
                <GameCard
                  href="/games/simon-says"
                  title="Ghi Nhớ (Simon Says)"
                  description="Game ghi nhớ giai điệu & màu sắc 4 nốt nhạc phong cách Studio Retro Console — lắng nghe và bấm lại nốt nhạc!"
                  icon={<Radio size={22} />}
                  accent="#facc15"
                  badge="Thử nghiệm"
                  tag="Casual"
                />
                <GameCard
                  href="/games/reversi-classic"
                  title="Cờ Lật (Reversi Deluxe)"
                  description="Cờ Lật Othello 8x8 phong cách Gỗ mộc thảm xanh rêu — kẹp lật quân cờ đối phương đọ điểm với Bot AI!"
                  icon={<Circle size={22} />}
                  accent="#10b981"
                  badge="Thử nghiệm"
                  tag="Cờ"
                />
                <GameCard
                  href="/games/speed-chess"
                  title="Cờ Vua Tốc Độ (Speed Chess)"
                  description="Cờ Vua Blitz 3 phút tốc độ cao — đồng hồ đếm ngược kịch tính từng giây với Bot AI!"
                  icon={<Zap size={22} />}
                  accent="#f59e0b"
                  badge="Thử nghiệm"
                  tag="Cờ"
                />
                <GameCard
                  href="/games/gomoku-pro"
                  title="Caro 15 Hàng (Gomoku Pro)"
                  description="Bàn cờ Gỗ Nhật Bản 15x15 chuyên nghiệp — nối 5 quân cờ liên tiếp để giành chiến thắng!"
                  icon={<Grid size={22} />}
                  accent="#d97706"
                  badge="Thử nghiệm"
                  tag="Cờ"
                />
                <GameCard
                  href="/games/piano-tiles"
                  title="Đánh Đàn Piano (Music Rhythm)"
                  description="Thể loại Âm Nhạc / Tiết Tấu — bấm các phím Piano đen rơi 60fps hòa cùng giai điệu nốt nhạc!"
                  icon={<Music size={22} />}
                  accent="#00f0ff"
                  badge="Thử nghiệm"
                  tag="Âm nhạc"
                />
                <GameCard
                  href="/games/farm-idle"
                  title="Nông Trại (Farm Idle Tycoon)"
                  description="Thể loại Mô Phỏng Quản Lý / Idle — tưới nước, trồng trọt cà chua, dưa hấu, thu hoạch tiền nông sản!"
                  icon={<Tractor size={22} />}
                  accent="#10b981"
                  badge="Thử nghiệm"
                  tag="Mô phỏng"
                />
                <GameCard
                  href="/games/trivia-quiz"
                  title="Đố Vui Trí Tuệ (Trivia Quiz)"
                  description="Thể loại Giáo Dục / Đố Vui — thử thách vốn hiểu biết địa lý, lịch sử và khoa học với bộ câu hỏi đố vui!"
                  icon={<HelpCircle size={22} />}
                  accent="#3b82f6"
                  badge="Thử nghiệm"
                  tag="Giáo dục"
                />
                <GameCard
                  href="/games/wheel-of-fortune"
                  title="Vòng Quay May Mắn (Wheel)"
                  description="Thể loại Party / May Mắn — quay bánh xe trúng tiền thưởng lớn lên đến $10,000!"
                  icon={<Disc size={22} />}
                  accent="#f43f5e"
                  badge="Thử nghiệm"
                  tag="Casual"
                />
              </div>
            </div>
            
            {/* Hành động & Phiêu lưu */}
            <div>
              <h3 className="mb-4 font-display text-xl font-semibold text-foreground flex items-center gap-2">
                <span className="text-amber-500">⚔️</span> Hành Động & Phiêu Lưu
              </h3>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <GameCard
                  href="/games/dead-cells-lite"
                  title="Dead Cells Lite"
                  description="Roguelike đi cảnh 2D — chiến đấu, nhặt vật phẩm, mỗi lượt chơi một khác. Bản demo khung."
                  icon={<Swords size={22} />}
                  accent="#f2b84b"
                  badge="Demo"
                  tag="Hành động"
                />
                <GameCard
                  href="/games/flappy"
                  title="Flappy Bird Arcade"
                  description="Vỗ cánh vượt chướng ngại vật mượt mà 60fps với hiệu ứng âm thanh & đồ họa retro hiện đại."
                  icon={<Bird size={22} />}
                  accent="#f59e0b"
                  badge="Arcade"
                  tag="Hành động"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Ad Banner */}
        <section className="flex justify-center py-8">
          <div data-banner-id="2024997"></div>
        </section>
      </main>
      <Footer />
    </>
  );
}
