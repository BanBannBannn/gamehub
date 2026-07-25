import Phaser from "phaser";

/**
 * Hậu cảnh nhiều lớp (parallax) + vignette. Các lớp xa dùng `scrollFactor`
 * nhỏ nên trôi chậm hơn khi camera di chuyển, tạo cảm giác sâu cho hang động.
 */

interface LayerSpec {
  /** Lớp càng xa thì hệ số càng nhỏ (0 = dán chặt vào camera). */
  scrollFactor: number;
  tint: number;
  alpha: number;
  /** Khoảng cách giữa các cột đá. */
  spacing: number;
  /** Vị trí đáy cột so với đáy màn. */
  bottomOffset: number;
  scale: number;
}

/**
 * Lớp càng xa càng lạnh và nhạt (xanh xám), lớp càng gần càng ấm và đậm —
 * mắt đọc chênh lệch màu này thành khoảng cách, nên hang trông sâu hơn là chỉ
 * đổi độ sáng.
 */
const LAYERS: LayerSpec[] = [
  { scrollFactor: 0.1, tint: 0x232a38, alpha: 0.85, spacing: 210, bottomOffset: 0, scale: 1.15 },
  { scrollFactor: 0.26, tint: 0x262a30, alpha: 0.95, spacing: 270, bottomOffset: 8, scale: 0.95 },
  { scrollFactor: 0.48, tint: 0x2b2620, alpha: 1, spacing: 330, bottomOffset: 16, scale: 0.8 },
];

/**
 * Dựng hậu cảnh cho cả thế giới. Trả về hàm cập nhật sương mù (gọi mỗi frame)
 * để lớp sương trôi nhẹ, tạo cảm giác không khí ẩm trong hang.
 */
export function buildParallaxBackdrop(
  scene: Phaser.Scene,
  worldWidth: number,
  worldHeight: number
): () => void {
  // Nền gradient tối dần từ trên xuống — vẽ bằng vài dải màu, dán vào camera.
  const bands = [0x241c17, 0x1f1813, 0x1a1310, 0x150f0c];
  bands.forEach((color, i) => {
    scene.add
      .rectangle(0, (worldHeight / bands.length) * i, scene.cameras.main.width, worldHeight / bands.length + 2, color)
      .setOrigin(0, 0)
      .setScrollFactor(0)
      .setDepth(-100 + i);
  });

  // Vòm hang xa: dải cong tối ở chân trời cho đỡ trống.
  for (let x = 0; x < worldWidth / 0.1 + 520; x += 480) {
    scene.add
      .image(x, worldHeight - 150, "cave-arch")
      .setOrigin(0.5, 1)
      .setTint(0x1e242f)
      .setAlpha(0.7)
      .setScrollFactor(0.06)
      .setDepth(-95);
  }

  LAYERS.forEach((layer, layerIndex) => {
    // Vẽ dư ra hai bên để lúc camera ở mép thế giới vẫn kín hậu cảnh.
    for (let x = -layer.spacing; x < worldWidth / layer.scrollFactor + layer.spacing; x += layer.spacing) {
      const variant = Math.abs(Math.floor(x / layer.spacing + layerIndex)) % 3;
      const rock = scene.add.image(x, worldHeight - layer.bottomOffset, `rock-${variant}`);
      rock
        .setOrigin(0.5, 1)
        .setScale(layer.scale)
        .setTint(layer.tint)
        .setAlpha(layer.alpha)
        .setScrollFactor(layer.scrollFactor)
        .setDepth(-90 + layerIndex);
      // Thạch nhũ rủ từ trần xuống (lật ngược cùng texture) — thưa hơn nền.
      if (variant !== 1) {
        scene.add
          .image(x + layer.spacing / 2, 0, `rock-${variant}`)
          .setOrigin(0.5, 1)
          .setScale(layer.scale * 0.7, -layer.scale * 0.55)
          .setTint(layer.tint)
          .setAlpha(layer.alpha * 0.9)
          .setScrollFactor(layer.scrollFactor)
          .setDepth(-90 + layerIndex);
      }
    }
  });

  // Cố tình KHÔNG thêm tầng tiền cảnh (khối đá chạy nhanh hơn camera): khung
  // hình chỉ cao 540px nên khối tiền cảnh che mất nhân vật lúc đánh nhau —
  // lợi về chiều sâu không bù được việc mất tầm nhìn.

  // Sương mù: 2 dải glow rộng trôi ngược nhau ở tầng thấp.
  const mist = [0, 1].map((i) => {
    const m = scene.add.image(0, worldHeight - 60 - i * 40, "glow");
    m.setOrigin(0, 0.5)
      .setDisplaySize(scene.cameras.main.width * 1.6, 220)
      .setTint(0x6b8f6b)
      .setAlpha(0.06 + i * 0.02)
      .setScrollFactor(0.06 + i * 0.05)
      .setDepth(-85 + i);
    return m;
  });

  // Vignette: 4 dải tối ở viền màn hình, dán chặt vào camera.
  buildVignette(scene);

  let t = 0;
  return () => {
    t += 0.0016;
    mist[0].x = Math.sin(t) * 90;
    mist[1].x = Math.cos(t * 0.8) * 120;
  };
}

/** Làm tối 4 viền màn hình để mắt tập trung vào giữa. */
function buildVignette(scene: Phaser.Scene): void {
  const cam = scene.cameras.main;
  const steps = 7;
  for (let i = 0; i < steps; i++) {
    const thickness = 10;
    const alpha = 0.1 * (1 - i / steps);
    const inset = i * thickness;
    const frame = scene.add.graphics().setScrollFactor(0).setDepth(110);
    frame.lineStyle(thickness, 0x000000, alpha);
    frame.strokeRect(
      inset - thickness / 2,
      inset - thickness / 2,
      cam.width - inset * 2 + thickness,
      cam.height - inset * 2 + thickness
    );
  }
}

/** Rải đuốc dọc theo phòng, mỗi cái kèm quầng sáng nhấp nháy. */
export function scatterTorches(scene: Phaser.Scene, fromX: number, toX: number, groundY: number): void {
  for (let x = fromX + 180; x < toX - 80; x += 340) {
    const torch = scene.add.sprite(x, groundY - 150, "torch-0");
    torch.setDepth(2).setScale(1.4);
    torch.play("torch-burn");

    const glow = scene.add.image(x, groundY - 150, "glow");
    glow.setDisplaySize(260, 260).setTint(0xffb347).setAlpha(0.16).setDepth(1).setBlendMode(Phaser.BlendModes.ADD);

    // Nhấp nháy nhẹ, lệch pha mỗi cây để không đập cùng nhịp.
    scene.tweens.add({
      targets: glow,
      alpha: { from: 0.12, to: 0.22 },
      displayWidth: { from: 240, to: 285 },
      displayHeight: { from: 240, to: 285 },
      duration: 520 + (x % 240),
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });
  }
}
