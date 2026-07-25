import Phaser from "phaser";
import { hitstopMsFor } from "../engine/feel";

/**
 * Các hiệu ứng "juice" — thứ khiến đòn đánh có cảm giác nặng tay: đứng hình
 * (hitstop), rung màn hình, tia lửa, bụi, số sát thương bay lên, squash/stretch.
 * Tách khỏi GameScene để scene tập trung vào luật chơi.
 */

/**
 * Đứng hình ngắn khi trúng đòn (hitstop / freeze frame). Đây là kỹ thuật
 * quan trọng nhất tạo cảm giác "chạm" trong game hành động: tạm dừng mô phỏng
 * vật lý vài chục ms để cú đánh đọng lại.
 *
 * Dùng `physics.world.pause()` thay vì `scene.pause()` để tween/particle vẫn
 * chạy tiếp (nếu dừng cả scene thì hiệu ứng nổ cũng đứng theo, trông như lag).
 */
export function hitstop(scene: Phaser.Scene, damage: number, shouldResume: () => boolean = () => true): void {
  const world = scene.physics.world;
  if (world.isPaused) return;
  world.pause();
  // `shouldResume` để scene chặn việc bỏ tạm dừng nếu lúc đó đang mở bảng
  // chọn buff (cũng dùng physics.pause) — nếu không sẽ vô tình chạy lại game.
  scene.time.delayedCall(hitstopMsFor(damage), () => {
    if (shouldResume()) world.resume();
  });
}

/** Tia lửa bắn ra khi vũ khí chạm quái. */
export function burstSparks(scene: Phaser.Scene, x: number, y: number, tint = 0xffe9a8, count = 10): void {
  const emitter = scene.add.particles(x, y, "spark", {
    lifespan: 260,
    speed: { min: 90, max: 260 },
    scale: { start: 0.9, end: 0 },
    quantity: count,
    tint,
    blendMode: Phaser.BlendModes.ADD,
    emitting: false,
  });
  emitter.setDepth(60);
  emitter.explode(count);
  scene.time.delayedCall(700, () => emitter.destroy());
}

/** Bụi tung lên ở chân — dùng khi chạm đất, lướt, bật nhảy. */
export function puffDust(scene: Phaser.Scene, x: number, y: number, count = 7, spread = 120): void {
  const emitter = scene.add.particles(x, y, "dust", {
    lifespan: 420,
    speedX: { min: -spread, max: spread },
    speedY: { min: -70, max: -10 },
    scale: { start: 0.7, end: 0 },
    alpha: { start: 0.55, end: 0 },
    quantity: count,
    emitting: false,
  });
  emitter.setDepth(6);
  emitter.explode(count);
  scene.time.delayedCall(800, () => emitter.destroy());
}

/** Mảnh vụn khi quái bị hạ. */
export function burstDeath(scene: Phaser.Scene, x: number, y: number, tint: number): void {
  const emitter = scene.add.particles(x, y, "spark", {
    lifespan: 520,
    speed: { min: 60, max: 300 },
    gravityY: 700,
    scale: { start: 1.4, end: 0 },
    quantity: 18,
    tint,
    emitting: false,
  });
  emitter.setDepth(60);
  emitter.explode(18);
  scene.time.delayedCall(1000, () => emitter.destroy());
}

/** Số sát thương bay lên rồi mờ dần. */
export function floatDamageNumber(scene: Phaser.Scene, x: number, y: number, amount: number, isBig: boolean): void {
  const label = scene.add
    .text(x, y, String(Math.round(amount)), {
      fontFamily: "monospace",
      fontSize: isBig ? "22px" : "16px",
      color: isBig ? "#ffe08a" : "#ffffff",
      stroke: "#14100c",
      strokeThickness: 4,
    })
    .setOrigin(0.5)
    .setDepth(80);

  scene.tweens.add({
    targets: label,
    y: y - (isBig ? 46 : 34),
    alpha: 0,
    scale: isBig ? 1.25 : 1,
    duration: isBig ? 720 : 560,
    ease: "Cubic.easeOut",
    onComplete: () => label.destroy(),
  });
}

/**
 * Bóp/giãn sprite rồi trả về tỉ lệ gốc — nhấn mạnh động tác bật nhảy và
 * chạm đất. `baseScale` cho phép dùng với sprite đã bị phóng to (như boss).
 */
export function squash(
  scene: Phaser.Scene,
  target: Phaser.GameObjects.Sprite,
  scaleX: number,
  scaleY: number,
  duration = 130,
  baseScale = 1
): void {
  scene.tweens.killTweensOf(target);
  target.setScale(baseScale * scaleX, baseScale * scaleY);
  scene.tweens.add({
    targets: target,
    scaleX: baseScale,
    scaleY: baseScale,
    duration,
    ease: "Quad.easeOut",
  });
}

/** Bóng mờ để lại phía sau khi lướt / nhảy đôi. */
export function afterImage(scene: Phaser.Scene, sprite: Phaser.GameObjects.Sprite, tint = 0x67e8f9): void {
  const ghost = scene.add.sprite(sprite.x, sprite.y, sprite.texture.key);
  ghost.setFlipX(sprite.flipX).setScale(sprite.scaleX, sprite.scaleY);
  ghost.setTint(tint).setAlpha(0.5).setDepth(5);
  scene.tweens.add({
    targets: ghost,
    alpha: 0,
    duration: 260,
    onComplete: () => ghost.destroy(),
  });
}

/**
 * Báo "vừa ăn đòn" bằng viền đỏ 4 cạnh rồi mờ dần.
 *
 * Không dùng `camera.flash()`: hàm đó tô đỏ **toàn bộ** khung hình nên che mất
 * cả nhân vật lẫn quái đúng lúc người chơi cần nhìn rõ để né đòn tiếp. Viền
 * cạnh vẫn báo rõ mà giữa màn vẫn thấy đường.
 */
export function flashDamageEdges(scene: Phaser.Scene): void {
  const cam = scene.cameras.main;
  const thickness = 54;
  const bars = [
    scene.add.rectangle(0, 0, cam.width, thickness, 0xc02020).setOrigin(0, 0),
    scene.add.rectangle(0, cam.height - thickness, cam.width, thickness, 0xc02020).setOrigin(0, 0),
    scene.add.rectangle(0, 0, thickness, cam.height, 0xc02020).setOrigin(0, 0),
    scene.add.rectangle(cam.width - thickness, 0, thickness, cam.height, 0xc02020).setOrigin(0, 0),
  ];
  for (const bar of bars) {
    bar.setScrollFactor(0).setDepth(115).setAlpha(0.5);
    scene.tweens.add({
      targets: bar,
      alpha: 0,
      duration: 300,
      ease: "Quad.easeOut",
      onComplete: () => bar.destroy(),
    });
  }
}

/** Chữ nổi giữa màn (thông báo mở cổng, vào phòng trùm...). */
export function announce(scene: Phaser.Scene, text: string, color = "#f2b84b"): void {
  const cam = scene.cameras.main;
  const label = scene.add
    .text(cam.width / 2, cam.height * 0.32, text, {
      fontFamily: "monospace",
      fontSize: "26px",
      color,
      stroke: "#14100c",
      strokeThickness: 6,
      align: "center",
    })
    .setOrigin(0.5)
    .setScrollFactor(0)
    .setDepth(120)
    .setAlpha(0);

  scene.tweens.add({
    targets: label,
    alpha: 1,
    y: cam.height * 0.28,
    duration: 240,
    ease: "Quad.easeOut",
    onComplete: () => {
      scene.tweens.add({
        targets: label,
        alpha: 0,
        delay: 900,
        duration: 400,
        onComplete: () => label.destroy(),
      });
    },
  });
}
