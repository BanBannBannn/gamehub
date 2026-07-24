export interface MultiplayerGameConfig {
  minPlayers: number;
  maxPlayers: number;
  label: string; // tên hiển thị game, dùng cho sảnh chung/thông báo
}

/**
 * Chỉ liệt kê ở đây những game THỰC SỰ hỗ trợ chơi online nhiều người.
 * Game 1 người chơi (Sudoku, Minesweeper, Solitaire, Đoán số) không có
 * mặt trong danh sách này — không có khái niệm "đối thủ" nên không áp
 * dụng chế độ online.
 */
export const MULTIPLAYER_CONFIG: Record<string, MultiplayerGameConfig> = {
  caro: { minPlayers: 2, maxPlayers: 2, label: "Caro" },
  chess: { minPlayers: 2, maxPlayers: 2, label: "Cờ vua" },
  xiangqi: { minPlayers: 2, maxPlayers: 2, label: "Cờ tướng" },
  connect4: { minPlayers: 2, maxPlayers: 2, label: "Bốn quân" },
  reversi: { minPlayers: 2, maxPlayers: 2, label: "Cờ lật" },
};

export function isMultiplayerSupported(gameSlug: string): boolean {
  return gameSlug in MULTIPLAYER_CONFIG;
}

export function getMultiplayerConfig(gameSlug: string): MultiplayerGameConfig {
  const config = MULTIPLAYER_CONFIG[gameSlug];
  if (!config) {
    throw new Error(`Game "${gameSlug}" không hỗ trợ chế độ online.`);
  }
  return config;
}
