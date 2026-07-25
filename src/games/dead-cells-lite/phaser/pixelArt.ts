import Phaser from "phaser";

/**
 * Sinh toàn bộ texture của game bằng code (không cần file asset), phong cách
 * pixel-art. Thiết kế nhân vật/quái là **thiết kế gốc** — chỉ mượn thể loại
 * chứ không sao chép tạo hình của Dead Cells.
 *
 * Hai kỹ thuật chính:
 * - Nhân vật/quái vẽ bằng **lưới ký tự** ({@link rowsPainter}): mỗi ký tự là
 *   1 pixel phóng to, nên đọc source là thấy được hình — dễ chỉnh dáng hơn
 *   nhiều so với xếp hình chữ nhật.
 * - {@link paintOutlined} vẽ mỗi hình 5 lần (4 lần lệch 1 pixel bằng màu viền
 *   tối + 1 lần chính giữa) để mọi sprite có viền đen bao quanh, cộng thêm cột
 *   "viền sáng" (rim light) bên phải thân, nên nhân vật nổi hẳn khỏi nền hang
 *   tối thay vì lẫn vào.
 */

const S = 3;
const OUTLINE = 0x0d0b09;

type Put = (x: number, y: number, w: number, h: number, color: number) => void;
type Painter = (put: Put) => void;

function paintOutlined(
  scene: Phaser.Scene,
  key: string,
  gridW: number,
  gridH: number,
  painter: Painter,
  pixel = S
): void {
  const g = scene.add.graphics();
  const putAt = (dx: number, dy: number, forced: number | null): Put => (x, y, w, h, color) => {
    g.fillStyle(forced ?? color, 1);
    g.fillRect((x + dx + 1) * pixel, (y + dy + 1) * pixel, w * pixel, h * pixel);
  };
  for (const [dx, dy] of [
    [-1, 0],
    [1, 0],
    [0, -1],
    [0, 1],
  ]) {
    painter(putAt(dx, dy, OUTLINE));
  }
  painter(putAt(0, 0, null));
  g.generateTexture(key, (gridW + 2) * pixel, (gridH + 2) * pixel);
  g.destroy();
}

function paintPlain(
  scene: Phaser.Scene,
  key: string,
  widthPx: number,
  heightPx: number,
  draw: (g: Phaser.GameObjects.Graphics) => void
): void {
  const g = scene.add.graphics();
  draw(g);
  g.generateTexture(key, widthPx, heightPx);
  g.destroy();
}

/** Biến lưới ký tự thành painter. Ký tự không có trong bảng màu = trong suốt. */
function rowsPainter(rows: string[], palette: Record<string, number>): Painter {
  return (put) => {
    rows.forEach((row, y) => {
      for (let x = 0; x < row.length; x++) {
        const color = palette[row[x]];
        if (color !== undefined) put(x, y, 1, 1, color);
      }
    });
  };
}

/** Ghi đè vài ký tự lên lưới có sẵn (dùng để tạo dáng biến thể từ dáng gốc). */
function overlay(rows: string[], patches: Array<[row: number, col: number, text: string]>): string[] {
  const out = [...rows];
  for (const [row, col, text] of patches) {
    const line = out[row].padEnd(col + text.length, ".");
    out[row] = line.slice(0, col) + text + line.slice(col + text.length);
  }
  return out;
}

// ============================ Nhân vật chính ============================
// "Kẻ Trùm Đầu" — áo choàng chàm 3 tầng sáng, khăn coral, khe mắt phát sáng,
// đoản đao phát sáng lạnh. Viền sáng (R) chạy dọc sườn phải để tách khỏi nền.

const HERO_PALETTE: Record<string, number> = {
  D: 0x232b40, // choàng tối
  M: 0x35415e, // choàng trung
  L: 0x4a5a7d, // choàng sáng
  R: 0x8098c4, // viền sáng
  k: 0x141a2b, // bóng trong mũ trùm
  e: 0x8bf0ff, // khe mắt phát sáng
  S: 0xe8615c, // khăn
  s: 0xb84a46, // khăn tối
  B: 0xf2b84b, // dây lưng
  h: 0x2b2119, // bao tay
  W: 0xd8f7ff, // lưỡi đao sáng
  w: 0x7fd4e8, // lưỡi đao tối
  b: 0x1b1410, // ủng
};

/** Phần thân (18 hàng trên) — dùng chung cho mọi dáng, chỉ thay chân. */
const HERO_BODY: string[] = [
  "......DDDD......",
  ".....DDDDDDD....",
  "....DDDDDDDDD...",
  "....DkkkkkkDR...",
  "...DDkkkkkkkDR..",
  "...DkkkeeekkDR..",
  "...DkkkeeekkDR..",
  "...DDkkkkkkkDR..",
  "...MMMMMMMMMMR..",
  "..SSSSSSSSSSSR..",
  "..ssSSSSSSSssR..",
  "...MMLLLLLLMMh..",
  "...MLLLLLLLLMh..",
  "...MBBBBBBBBMw..",
  "...MLLLLLLLLMW..",
  "..DDMMMMMMMMDW..",
  "..DDDMMMMMMDDw..",
  "..DDD.MMMM.DD...",
];

const HERO_LEGS: Record<string, string[]> = {
  idle: ["....MM..MM......", "....MM..MM......", "....bb..bb......", "....bb..bb......"],
  runA: ["....MM..MM......", "...MM....MM.....", "..bb......bb....", "................"],
  runPass: ["....MM..MM......", "....MM..MM......", "....bb..bb......", "....bb..bb......"],
  runC: ["....MM..MM......", ".....MM.MM......", ".....bbbb.......", "................"],
  jump: ["....MM..MM......", "...MMM..MMM.....", "...bb....bb.....", "................"],
  fall: ["....MM..MM......", "....MM...MM.....", "...bb.....bb....", "................"],
  land: ["...MMMM.MMMM....", "...bb.....bb....", "................", "................"],
  dash: ["....MMMMMM......", "...bb....bb.....", "................", "................"],
};

/** Chuyển đao từ tư thế chống xuống sang tư thế vung ngang trước mặt. */
const RAISE_BLADE: Array<[number, number, string]> = [
  [9, 13, "WWw"],
  [10, 13, "wW."],
  [13, 13, "."],
  [14, 13, "."],
  [15, 13, "."],
  [16, 13, "."],
];

function heroRows(legs: keyof typeof HERO_LEGS, attacking = false): string[] {
  const body = attacking ? overlay(HERO_BODY, RAISE_BLADE) : HERO_BODY;
  return [...body, ...HERO_LEGS[legs]];
}

const HERO_POSES: Record<string, string[]> = {
  "hero-idle": heroRows("idle"),
  "hero-run-0": heroRows("runA"),
  "hero-run-1": heroRows("runPass"),
  "hero-run-2": heroRows("runC"),
  "hero-run-3": heroRows("runPass"),
  "hero-jump": heroRows("jump"),
  "hero-fall": heroRows("fall"),
  "hero-land": heroRows("land"),
  "hero-dash": heroRows("dash"),
  "hero-attack": heroRows("runA", true),
  "hero-air-attack": heroRows("jump", true),
};

export const HERO_GRID_W = 16;
export const HERO_GRID_H = 22;

// ================================ Quái ================================

const WALKER_PALETTE: Record<string, number> = {
  C: 0x8f2836, // mai giáp
  c: 0x5c1620, // mai giáp tối
  H: 0xb8404e, // gờ sáng
  e: 0xf2b84b, // mắt
  p: 0x1b0d10, // con ngươi
  L: 0x46101a, // chân
};

/** "Bọ Vực" — quái bò thấp, mai giáp đỏ, 4 chân so le. */
function walkerRows(legPhase: 0 | 1): string[] {
  const legs =
    legPhase === 0
      ? ["..LL....LL....", "..L......L...."]
      : [".LL......LL...", "..L......L...."];
  return [
    "....HHHHHH....",
    "..HHCCCCCCHH..",
    ".HCCCCCCCCCCH.",
    ".CCeeCCCCeeCC.",
    ".CCepCCCCpeCC.",
    ".cCCCCCCCCCCc.",
    "..cCCCCCCCCc..",
    "...cc....cc...",
    ...legs,
  ];
}

const SHOOTER_PALETTE: Record<string, number> = {
  M: 0x6b4fbb, // vỏ
  m: 0x4a3585, // vỏ tối
  H: 0x8b6fd8, // gờ sáng
  W: 0xe9e4ff, // lòng trắng
  e: 0x67e8f9, // đồng tử phát sáng
};

/** "Bào Tử Canh Gác" — mắt lơ lửng, tua rua đưa qua đưa lại. */
function shooterRows(bob: 0 | 1): string[] {
  const tail = bob === 0 ? ["..m..m..m...", "..m......m..", "..m.........."] : [".m...m...m..", "..m.....m...", ".........m.."];
  return [
    "...HHHHHH...",
    "..HMMMMMMH..",
    ".HMMMMMMMMH.",
    ".MMWWWWWWMM.",
    ".MMWeeeeWMM.",
    ".MMWWeeWWMM.",
    ".mMMWWWWMMm.",
    "..mMMMMMMm..",
    "...mmmmmm...",
    ...tail,
  ];
}

const BOSS_PALETTE: Record<string, number> = {
  D: 0x2b0a0a, // thân tối
  M: 0x4a1414, // thân
  H: 0x6b1f1f, // gờ sáng
  S: 0xff5544, // gai/sừng
  e: 0xffaa00, // mắt cháy
  p: 0x1a0505, // con ngươi
  L: 0x1f0707, // chân
};

/** "Cự Vệ Gai" — trùm cuối: sừng cong, gai lưng, mắt cháy. */
function bossRows(legPhase: 0 | 1): string[] {
  const legs =
    legPhase === 0
      ? ["...LLL......LLL...", "...LL........LL..."]
      : ["..LLL........LLL..", "...LL........LL..."];
  return [
    "..S..............S..",
    "..SS....SSSS....SS..",
    "...SS..SSDDSS..SS...",
    "....SSDDDDDDDDSS....",
    "...HHDDDDDDDDDDHH...",
    "..HMMMMMMMMMMMMMMH..",
    "..MMeeeMMMMMMeeeMM..",
    "..MMepeMMMMMMepeMM..",
    "..MMMMMMMMMMMMMMMM..",
    "..HMMMMMMMMMMMMMMH..",
    "...MMMMMMMMMMMMMM...",
    "...DDMMMMMMMMMMDD...",
    "....DDDMMMMMMDDD....",
    "....DDDDDDDDDDDD....",
    ...legs,
  ];
}

// ======================== Môi trường & hiệu ứng ========================

const TILE_PX = 64;
export const TILE_VARIANTS = ["tile-ground-0", "tile-ground-1", "tile-ground-2"] as const;

/**
 * Tile nền: đá xám-nâu có vân nứt + lớp rêu rủ xuống ở mặt trên. Có 3 biến
 * thể để mặt đất dài không bị lặp hoa văn lộ liễu.
 */
function buildTileTextures(scene: Phaser.Scene): void {
  /**
   * Mỗi tile là một mảng "hòn đá" xếp so le, mỗi hòn có gờ sáng ở cạnh trên và
   * bóng đổ ở cạnh dưới → ra khối đá thật. Trước đây tile chỉ có vài vạch dài
   * làm vân nứt, nhìn ra thành chữ "L"/"|" nên rất giả.
   */
  const stonesPerVariant: Array<Array<[x: number, y: number, w: number, h: number]>> = [
    [
      [-4, 10, 26, 16],
      [24, 12, 22, 14],
      [48, 10, 22, 18],
      [2, 28, 20, 16],
      [24, 28, 26, 14],
      [52, 30, 18, 16],
      [-2, 46, 24, 14],
      [26, 44, 20, 16],
      [48, 48, 22, 12],
    ],
    [
      [-6, 8, 22, 18],
      [18, 10, 26, 16],
      [46, 12, 24, 14],
      [-2, 30, 26, 14],
      [28, 28, 18, 18],
      [48, 30, 22, 14],
      [4, 46, 20, 14],
      [28, 48, 24, 12],
      [54, 46, 16, 16],
    ],
    [
      [-2, 12, 24, 14],
      [26, 8, 20, 18],
      [50, 12, 20, 16],
      [-4, 28, 22, 16],
      [22, 30, 24, 14],
      [50, 28, 20, 18],
      [2, 46, 26, 14],
      [32, 46, 18, 14],
      [52, 48, 18, 12],
    ],
  ];

  // Rêu: chỉ 2–3 chùm mỗi tile, độ sâu lệch nhau, vị trí khác nhau theo biến
  // thể — để mặt đất dài không thành "hàng răng lược" đều tăm tắp.
  const mossPerVariant: Array<Array<[x: number, w: number, depth: number]>> = [
    [
      [3, 9, 11],
      [30, 6, 6],
      [49, 11, 15],
    ],
    [
      [12, 12, 14],
      [40, 8, 8],
    ],
    [
      [1, 7, 7],
      [21, 10, 13],
      [45, 7, 9],
      [58, 5, 5],
    ],
  ];

  TILE_VARIANTS.forEach((key, variant) => {
    paintPlain(scene, key, TILE_PX, TILE_PX, (g) => {
      // Vữa kẽ đá (nền tối lấp giữa các hòn)
      g.fillStyle(0x1c1714, 1);
      g.fillRect(0, 0, TILE_PX, TILE_PX);

      for (const [x, y, w, h] of stonesPerVariant[variant]) {
        g.fillStyle(0x3a312b, 1);
        g.fillRect(x, y, w, h);
        g.fillStyle(0x4b4139, 1); // gờ sáng cạnh trên
        g.fillRect(x, y, w, 3);
        g.fillStyle(0x2a2320, 1); // bóng cạnh dưới
        g.fillRect(x, y + h - 3, w, 3);
      }

      // Đáy tile tối lại để các tầng nền tách nhau rõ.
      g.fillStyle(0x171310, 1);
      g.fillRect(0, TILE_PX - 5, TILE_PX, 5);

      // Lớp rêu mặt trên: dải mỏng + vài chùm rủ xuống lệch nhau.
      g.fillStyle(0x3d5528, 1);
      g.fillRect(0, 0, TILE_PX, 8);
      g.fillStyle(0x4f6b34, 1);
      g.fillRect(0, 0, TILE_PX, 5);
      for (const [x, w, depth] of mossPerVariant[variant]) {
        g.fillStyle(0x3d5528, 1);
        g.fillRect(x, 5, w, depth);
        g.fillStyle(0x4f6b34, 1);
        g.fillRect(x + 1, 5, Math.max(2, w - 3), Math.max(2, depth - 4));
      }
    });
  });
}

function buildEffectTextures(scene: Phaser.Scene): void {
  // Cổng chặn: khung sắt + then ngang + lõi phát sáng.
  paintPlain(scene, "gate", 26, TILE_PX * 4, (g) => {
    g.fillStyle(0x1d1815, 1);
    g.fillRect(0, 0, 26, TILE_PX * 4);
    g.fillStyle(0x5c2020, 1);
    g.fillRect(3, 0, 20, TILE_PX * 4);
    g.fillStyle(0x7a2a2a, 1);
    g.fillRect(6, 0, 6, TILE_PX * 4);
    for (let y = 12; y < TILE_PX * 4; y += 34) {
      g.fillStyle(0x2b0f0f, 1);
      g.fillRect(1, y, 24, 8);
      g.fillStyle(0xf2b84b, 1);
      g.fillRect(9, y + 2, 9, 4);
    }
  });

  // Vệt chém hình lưỡi liềm (3 mức combo, đòn kết to & sáng nhất).
  const slashSpecs: Array<[string, number, number, number, number]> = [
    ["slash-0", 56, 36, 0xbfe9ff, 0.66],
    ["slash-1", 62, 42, 0xd8f3ff, 0.62],
    ["slash-2", 78, 58, 0xffe9a8, 0.58],
  ];
  for (const [key, w, h, color, inner] of slashSpecs) {
    paintPlain(scene, key, w, h, (g) => {
      // Vẽ liềm bằng 2 cung: cung ngoài đầy màu, cung trong khoét bằng cách
      // vẽ lại nền trong suốt không được — nên xếp nhiều cung mảnh thay thế.
      const steps = 22;
      for (let i = 0; i < steps; i++) {
        const t = i / steps;
        const radius = w * (inner + (1 - inner) * t);
        const alpha = 0.25 + 0.75 * Math.sin(Math.PI * t);
        g.lineStyle(3, color, alpha);
        g.beginPath();
        g.arc(0, h / 2, radius, Phaser.Math.DegToRad(-54), Phaser.Math.DegToRad(54), false);
        g.strokePath();
      }
    });
  }

  paintOutlined(scene, "projectile", 4, 4, (p) => {
    p(1, 0, 2, 4, 0xf2b84b);
    p(0, 1, 4, 2, 0xf2b84b);
    p(1, 1, 2, 2, 0xfff1c9);
  });
  paintPlain(scene, "spark", 6, 6, (g) => {
    g.fillStyle(0xffffff, 1);
    g.fillRect(0, 0, 6, 6);
  });
  paintPlain(scene, "dust", 10, 10, (g) => {
    g.fillStyle(0x9c8f7a, 1);
    g.fillCircle(5, 5, 5);
  });

  // Bình máu vẽ dạng trái tim, tế bào vẽ dạng viên ngọc có mặt cắt — dùng lưới
  // ký tự nên hình dễ đọc hơn hẳn so với xếp khối chữ nhật.
  const heart = [".HH.HH.", "HHHHHHH", "HWHHHHH", "HWHHHHH", ".HHHHH.", "..HHH..", "...d..."];
  paintOutlined(
    scene,
    "pickup-health",
    7,
    7,
    rowsPainter(heart, { H: 0x3fae6b, W: 0xd9ffe9, d: 0x2f8f55 })
  );

  const gem = ["..G..", ".GWG.", "GWWGG", "GGGGG", ".GdG.", "..d.."];
  paintOutlined(scene, "pickup-cell", 5, 6, rowsPainter(gem, { G: 0x4fd1c5, W: 0xd6fffb, d: 0x2a9c92 }));

  paintPlain(scene, "glow", 128, 128, (g) => {
    for (let r = 64; r > 0; r -= 3) {
      g.fillStyle(0xffffff, 0.028);
      g.fillCircle(64, 64, r);
    }
  });
}

/** Đuốc tường: 3 khung lửa để nhấp nháy. */
function buildTorchTextures(scene: Phaser.Scene): void {
  const flamePalette: Record<string, number> = {
    o: 0xff7a2f,
    y: 0xffd166,
    W: 0xfff3c4,
    s: 0x3b322c,
    d: 0x1d1815,
  };
  const frames: string[][] = [
    ["..y..", ".yWy.", ".yoy.", "..o..", ".sss.", "..s..", "..s..", "..d.."],
    [".y.y.", ".yWy.", "yooy.", ".yo..", ".sss.", "..s..", "..s..", "..d.."],
    ["..o..", ".yWy.", ".yoy.", ".oo..", ".sss.", "..s..", "..s..", "..d.."],
  ];
  frames.forEach((rows, i) => paintOutlined(scene, `torch-${i}`, 5, 8, rowsPainter(rows, flamePalette)));
}

/**
 * Bóng đá hậu cảnh cho lớp parallax. Vẽ bằng cung tròn xếp lớp nên sườn đá
 * vát mượt, không bị lộ bậc thang như xếp hình chữ nhật.
 */
function buildBackdropTextures(scene: Phaser.Scene): void {
  const specs: Array<[string, number, number, number]> = [
    ["rock-0", 150, 300, 0.55],
    ["rock-1", 110, 380, 0.4],
    ["rock-2", 210, 250, 0.75],
  ];
  for (const [key, w, h, taper] of specs) {
    paintPlain(scene, key, w, h, (g) => {
      g.fillStyle(0xffffff, 1);
      // Mỗi lát cao 4px, bề rộng thu nhỏ dần theo hàm mũ → sườn cong.
      for (let y = 0; y < h; y += 4) {
        const t = y / h;
        const width = w * (1 - Math.pow(t, 1.6) * taper);
        g.fillRect((w - width) / 2, h - y - 4, width, 4);
      }
    });
  }

  // Vòm hang phía xa: một dải cong tối để chân trời không trống trải.
  paintPlain(scene, "cave-arch", 520, 200, (g) => {
    g.fillStyle(0xffffff, 1);
    for (let x = 0; x < 520; x += 4) {
      const t = x / 520;
      const dip = Math.sin(Math.PI * t);
      const top = 200 - dip * 170;
      g.fillRect(x, top, 4, 200 - top);
    }
  });
}

export function buildAllTextures(scene: Phaser.Scene): void {
  for (const [key, rows] of Object.entries(HERO_POSES)) {
    paintOutlined(scene, key, HERO_GRID_W, HERO_GRID_H, rowsPainter(rows, HERO_PALETTE));
  }
  paintOutlined(scene, "walker-0", 14, 10, rowsPainter(walkerRows(0), WALKER_PALETTE));
  paintOutlined(scene, "walker-1", 14, 10, rowsPainter(walkerRows(1), WALKER_PALETTE));
  paintOutlined(scene, "shooter-0", 12, 12, rowsPainter(shooterRows(0), SHOOTER_PALETTE));
  paintOutlined(scene, "shooter-1", 12, 12, rowsPainter(shooterRows(1), SHOOTER_PALETTE));
  paintOutlined(scene, "boss-0", 20, 16, rowsPainter(bossRows(0), BOSS_PALETTE));
  paintOutlined(scene, "boss-1", 20, 16, rowsPainter(bossRows(1), BOSS_PALETTE));

  buildTileTextures(scene);
  buildEffectTextures(scene);
  buildTorchTextures(scene);
  buildBackdropTextures(scene);

  const anims = scene.anims;
  const frames = (keys: string[]) => keys.map((key) => ({ key }));
  const ensure = (key: string, keys: string[], frameRate: number) => {
    if (!anims.exists(key)) anims.create({ key, frames: frames(keys), frameRate, repeat: -1 });
  };
  ensure("hero-run", ["hero-run-0", "hero-run-1", "hero-run-2", "hero-run-3"], 12);
  ensure("walker-walk", ["walker-0", "walker-1"], 5);
  ensure("shooter-bob", ["shooter-0", "shooter-1"], 3);
  ensure("boss-walk", ["boss-0", "boss-1"], 4);
  ensure("torch-burn", ["torch-0", "torch-1", "torch-2"], 9);
}
