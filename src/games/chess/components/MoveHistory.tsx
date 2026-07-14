import { useChessStore } from "@/games/chess/store";
import { useEffect, useRef } from "react";

export function MoveHistory() {
  const game = useChessStore((s) => s.game);
  const pgn = useChessStore((s) => s.pgn); // depend on pgn to trigger re-renders
  const scrollRef = useRef<HTMLDivElement>(null);

  // Parse history into pairs
  const history = game.history();
  const pairs: { w: string; b?: string }[] = [];
  for (let i = 0; i < history.length; i += 2) {
    pairs.push({
      w: history[i],
      b: history[i + 1],
    });
  }

  // Auto scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [pgn]);

  if (pairs.length === 0) {
    return (
      <div className="flex h-32 w-full max-w-[500px] items-center justify-center rounded-xl bg-surface-hover text-sm text-muted ring-1 ring-border">
        Chưa có nước đi nào
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full max-w-[500px] overflow-hidden rounded-xl bg-surface ring-1 ring-border">
      <div className="bg-surface-hover px-4 py-2 text-xs font-semibold uppercase tracking-wider text-muted">
        Lịch sử nước đi
      </div>
      <div 
        ref={scrollRef}
        className="flex max-h-[250px] sm:max-h-[400px] lg:max-h-[500px] flex-col overflow-y-auto p-2 text-sm"
      >
        {pairs.map((pair, idx) => (
          <div key={idx} className="flex rounded-md px-2 py-1 hover:bg-surface-hover">
            <span className="w-8 text-muted">{idx + 1}.</span>
            <span className="w-16 font-medium text-foreground">{pair.w}</span>
            {pair.b && <span className="font-medium text-foreground">{pair.b}</span>}
          </div>
        ))}
      </div>
    </div>
  );
}
