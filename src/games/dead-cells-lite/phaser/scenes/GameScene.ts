import Phaser from "phaser";
import { comboDamage, knockbackDirection } from "../../engine/combat";
import { cutJumpVelocity, decideJump, gravityScaleFor } from "../../engine/feel";
import { GROUND_TILE_Y, ROOM_HEIGHT_TILES, TILE, pickRun } from "../../engine/roomPool";
import { EnemyKind, ENEMY_STATS, PLAYER_WEAPON, RoomTemplate, RunEventPayload } from "../../engine/types";
import { PlayerStats, Upgrade, UpgradeId, applyUpgrade, createBaseStats, rollUpgradeChoices } from "../../engine/upgrades";
import { buildParallaxBackdrop, scatterTorches } from "../background";
import {
  afterImage,
  announce,
  burstDeath,
  burstSparks,
  flashDamageEdges,
  floatDamageNumber,
  hitstop,
  puffDust,
  squash,
} from "../effects";
import { TILE_VARIANTS, buildAllTextures } from "../pixelArt";

const WORLD_HEIGHT = ROOM_HEIGHT_TILES * TILE;

const BASE_SPEED = 250;
const JUMP_VELOCITY = -660;
const DOUBLE_JUMP_VELOCITY = -580;
const BASE_GRAVITY = 1500;

const DASH_SPEED = 660;
const DASH_DURATION_MS = 165;
const BASE_DASH_COOLDOWN_MS = 520;

const PLAYER_IFRAME_MS = 750;
const ATTACK_ACTIVE_MS = 130;
const ATTACK_RECOVERY_MS = 90;
const LAND_RECOVERY_MS = 110;
const ATTACK_HEIGHT = 54;
const ATTACK_REACH = 30;

const PROJECTILE_SPEED = 330;
const SHOOTER_RANGE = 430;
const SHOOTER_TELEGRAPH_MS = 340;
const SHOOTER_INTERVAL_MS = 1750;
const WALKER_AGGRO_RANGE = 250;
const WALKER_PATROL_RANGE = 96;
/**
 * Phải NHỎ hơn tầm với hiệu dụng của người chơi (rangePx 62 tính từ tâm, cộng
 * nửa bề ngang quái ≈ 92px giữa hai tâm). Nếu lớn hơn, quái sẽ luôn dừng nhá
 * đòn ở ngoài tầm chém — đứng yên thì không thể phản đòn, buộc phải bước vào
 * tầm bị đánh. Kiểm thử tự động vung ~150 nhát mà không hạ được con nào vì lỗi
 * cân bằng này.
 */
const WALKER_STRIKE_RANGE = 70;
const WALKER_TELEGRAPH_MS = 330;
const WALKER_LUNGE_MS = 240;
const WALKER_LUNGE_SPEED = 330;
const WALKER_ATTACK_COOLDOWN_MS = 1250;
const DROP_THROUGH_MS = 260;

type EnemySprite = Phaser.Physics.Arcade.Sprite;

/**
 * Toàn bộ gameplay Phase 1. Ngoài luật chơi (phòng nối tiếp, cổng khoá, boss,
 * vật phẩm) scene này tập trung nhiều vào **cảm giác điều khiển**:
 *
 * - Coyote time + jump buffer + variable jump height (xem `engine/feel.ts`).
 * - Nhảy đôi, lướt trên mặt đất **và** trên không (mỗi lần rời đất 1 lần lướt).
 * - Huỷ động tác (cancel): lướt huỷ được đòn đánh và pha nhún khi hạ đất,
 *   nhảy huỷ được đòn đánh — nhờ vậy chuỗi hành động không bị "kẹt" như khi
 *   phải chờ hết animation.
 * - Rơi xuyên nền: giữ ↓ + nhảy để tụt xuống bệ đá phía dưới.
 * - Hitstop, rung màn, tia lửa, số sát thương, squash/stretch cho đòn đánh.
 *
 * Giao tiếp ra React qua `registry.get("onRunEvent")` (DeadCellsCanvas set
 * trước khi scene `create()` chạy) vì Phaser Scene không nhận props React.
 */
export class GameScene extends Phaser.Scene {
  private player!: Phaser.Physics.Arcade.Sprite;
  private solidGround!: Phaser.Physics.Arcade.StaticGroup;
  private oneWayPlatforms!: Phaser.Physics.Arcade.StaticGroup;
  private enemies!: Phaser.Physics.Arcade.Group;
  private projectiles!: Phaser.Physics.Arcade.Group;
  private pickups!: Phaser.Physics.Arcade.Group;
  private gates!: Phaser.Physics.Arcade.StaticGroup;

  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private keys!: Record<"a" | "d" | "w" | "s" | "dash" | "attack" | "one" | "two" | "three", Phaser.Input.Keyboard.Key>;
  private touch = { left: false, right: false, down: false, jump: false, dash: false, attack: false };

  private roomTemplates: RoomTemplate[] = [];
  private roomBoundaries: number[] = [];
  private roomEnemyCounts: number[] = [];
  private roomUpgradeOffered: boolean[] = [];
  private worldWidth = 0;
  private currentRoomIndex = 0;
  private announcedBossRoom = false;

  // --- trạng thái nhân vật ---
  private stats: PlayerStats = createBaseStats();
  private hp = 100;
  private facing: 1 | -1 = 1;
  private jumpsUsed = 0;
  private lastOnGroundAt = 0;
  private lastJumpPressedAt = -9999;
  private wasOnGround = true;
  private landRecoveryUntil = 0;
  private dropThroughUntil = 0;

  private isDashing = false;
  private dashEndsAt = 0;
  private dashCooldownUntil = 0;
  private airDashUsed = false;

  private invulnerableUntil = 0;
  private comboIndex = 0;
  private activeSwingComboIndex = 0;
  private comboWindowEndsAt = 0;
  private attackActiveUntil = 0;
  private attackRecoveryUntil = 0;
  private attackHitThisSwing = new Set<EnemySprite>();

  private cellsCollected = 0;
  private runStartTime = 0;
  private runEnded = false;

  // --- bảng chọn buff giữa các phòng ---
  private upgradeOpen = false;
  private upgradeChoices: Upgrade[] = [];
  private upgradeNodes: Phaser.GameObjects.GameObject[] = [];

  // --- HUD ---
  private hpBarFg!: Phaser.GameObjects.Rectangle;
  private hpBarLabel!: Phaser.GameObjects.Text;
  private dashPip!: Phaser.GameObjects.Rectangle;
  private roomText!: Phaser.GameObjects.Text;
  private cellsText!: Phaser.GameObjects.Text;
  private bossBarFg?: Phaser.GameObjects.Rectangle;
  private enemyHpBars = new Map<EnemySprite, { bg: Phaser.GameObjects.Rectangle; fg: Phaser.GameObjects.Rectangle }>();
  private updateMist: () => void = () => {};

  constructor() {
    super("GameScene");
  }

  create() {
    this.resetRunState();
    buildAllTextures(this);

    this.roomTemplates = pickRun(Date.now() ^ Math.floor(Math.random() * 1e9));
    this.solidGround = this.physics.add.staticGroup();
    this.oneWayPlatforms = this.physics.add.staticGroup();
    this.gates = this.physics.add.staticGroup();
    this.enemies = this.physics.add.group();
    this.projectiles = this.physics.add.group({ allowGravity: false });
    this.pickups = this.physics.add.group();

    this.buildWorld();
    this.updateMist = buildParallaxBackdrop(this, this.worldWidth, WORLD_HEIGHT);

    this.player = this.physics.add.sprite(120, WORLD_HEIGHT - 220, "hero-idle");
    // Texture 54x72 (lưới 16x22 + viền, mỗi pixel 3px). Khối va chạm bó sát
    // thân và khớp đáy với gót chân để không bị "lơ lửng" trên mặt đất.
    this.player.setSize(24, 56).setOffset(15, 13);
    this.player.setDepth(10);
    this.player.setCollideWorldBounds(true);
    this.physics.world.setBounds(0, -400, this.worldWidth, WORLD_HEIGHT + 460);

    this.physics.add.collider(this.player, this.solidGround);
    // Bệ đá lửng là nền 1 chiều: nhảy xuyên được từ dưới lên, và giữ ↓+nhảy
    // để tụt xuống — nên phải quyết định va chạm bằng processCallback.
    this.physics.add.collider(this.player, this.oneWayPlatforms, undefined, (playerObj, platformObj) =>
      this.shouldLandOnPlatform(playerObj as Phaser.Physics.Arcade.Sprite, platformObj as Phaser.Physics.Arcade.Sprite)
    );

    // Một collider duy nhất cho mọi cổng; cổng nào còn khoá thì chặn. Cách này
    // thay cho việc tạo/huỷ collider riêng từng cổng — trước đây dùng
    // `staticSprite` rời + huỷ collider theo chỉ số, và cổng KHÔNG chặn được
    // người chơi (đi bộ xuyên hết các cổng tới thẳng phòng trùm).
    this.physics.add.collider(
      this.player,
      this.gates,
      undefined,
      (_playerObj, gateObj) => (gateObj as Phaser.GameObjects.Sprite).getData("locked") === true
    );
    this.physics.add.collider(this.enemies, this.solidGround);
    this.physics.add.collider(this.enemies, this.oneWayPlatforms);
    this.physics.add.collider(this.projectiles, this.solidGround, (proj) => proj.destroy());
    this.physics.add.overlap(this.player, this.enemies, (_p, enemy) => this.onEnemyContact(enemy as EnemySprite));
    this.physics.add.overlap(this.player, this.projectiles, (_p, proj) => this.onProjectileHit(proj as EnemySprite));
    this.physics.add.overlap(this.player, this.pickups, (_p, pickup) => this.onPickup(pickup as EnemySprite));

    this.setupCamera();
    this.setupInput();
    this.buildHud();
    this.runStartTime = this.time.now;
    this.lastOnGroundAt = this.time.now;
  }

  update() {
    this.updateMist();
    if (this.runEnded) return;
    if (this.upgradeOpen) {
      this.handleUpgradeInput();
      return;
    }

    const now = this.time.now;
    const body = this.player.body as Phaser.Physics.Arcade.Body;
    const onGround = body.blocked.down || body.touching.down;

    this.trackGroundState(now, onGround, body);
    this.applyGravityFeel(body);

    if (this.isDashing) {
      if (now >= this.dashEndsAt) this.endDash();
    } else {
      this.handleMovement(onGround);
      this.handleJumpAndDrop(now, onGround, body);
      this.handleDash(now, onGround);
      this.handleAttack(now);
    }

    if (this.attackActiveUntil > now) this.checkAttackHit();
    this.updatePlayerAnimation(now, onGround, body.velocity.y);

    this.player.setAlpha(now < this.invulnerableUntil ? (Math.floor(now / 60) % 2 === 0 ? 0.45 : 0.95) : 1);
    if (this.player.y > WORLD_HEIGHT + 420) this.killPlayer();

    this.updateEnemies(now);
    this.updateProjectiles();
    this.updateHud(now);
    this.touch.jump = false;
  }

  // ================== dựng thế giới ==================

  private buildWorld() {
    let offsetX = 0;
    this.roomTemplates.forEach((room, roomIndex) => {
      room.platforms.forEach((platform) => {
        const isFloating = platform.tileY < GROUND_TILE_Y;
        const group = isFloating ? this.oneWayPlatforms : this.solidGround;
        for (let i = 0; i < platform.tileCount; i++) {
          // Xen kẽ 3 biến thể tile để mặt đất dài không lộ hoa văn lặp.
          const variant = TILE_VARIANTS[(platform.tileX + i + platform.tileY) % TILE_VARIANTS.length];
          const tile = group.create(
            offsetX + (platform.tileX + i) * TILE + TILE / 2,
            platform.tileY * TILE + TILE / 2,
            variant
          ) as Phaser.Physics.Arcade.Sprite;
          tile.setDepth(3);
        }
      });
      room.enemies.forEach((e) => this.spawnEnemy(e.kind, offsetX + e.x + TILE / 2, e.y + TILE / 2, roomIndex));
      room.pickups.forEach((p) => this.spawnPickup(p.kind, offsetX + p.x + TILE / 2, p.y + TILE / 2));
      this.roomEnemyCounts[roomIndex] = room.enemies.length;
      this.roomUpgradeOffered[roomIndex] = false;

      scatterTorches(this, offsetX, offsetX + room.width, GROUND_TILE_Y * TILE);

      offsetX += room.width;
      this.roomBoundaries.push(offsetX);

      if (roomIndex < this.roomTemplates.length - 1) {
        const gate = this.gates.create(
          offsetX - TILE / 2,
          (GROUND_TILE_Y - 2) * TILE,
          "gate"
        ) as Phaser.Physics.Arcade.Sprite;
        gate.setData("guardsRoomIndex", roomIndex);
        gate.setData("locked", true);
        gate.setDepth(4);
      }
    });
    this.worldWidth = offsetX;
  }

  private spawnEnemy(kind: EnemyKind, x: number, y: number, roomIndex: number) {
    const stats = ENEMY_STATS[kind];
    const textureKey = kind === "boss" ? "boss-0" : kind === "shooter" ? "shooter-0" : "walker-0";
    const sprite = this.enemies.create(x, y, textureKey) as EnemySprite;
    sprite.setData("kind", kind);
    sprite.setData("hp", stats.maxHp);
    sprite.setData("maxHp", stats.maxHp);
    sprite.setData("roomIndex", roomIndex);
    sprite.setData("lastContactAt", 0);
    sprite.setData("lastShotAt", 0);
    sprite.setData("telegraphUntil", 0);
    sprite.setData("patrolDir", 1);
    sprite.setData("spawnX", x);
    sprite.setData("bossPhase", "chase");
    sprite.setData("bossNextActionAt", 0);
    sprite.setCollideWorldBounds(true);
    sprite.setBounce(0);
    sprite.setDepth(8);

    if (kind === "boss") {
      sprite.setScale(1.6);
      sprite.play("boss-walk");
    } else if (kind === "walker") {
      sprite.play("walker-walk");
    } else {
      sprite.play("shooter-bob");
      (sprite.body as Phaser.Physics.Arcade.Body).setAllowGravity(false);
    }

    // Thanh máu vẽ dưới nhân vật (depth 9 < 10) để không che mặt nhân vật khi
    // đứng trùng nhau, và chỉ hiện khi quái đã bị thương cho đỡ rối mắt.
    const bg = this.add.rectangle(x, y - 34, 36, 6, 0x14100c).setDepth(9).setVisible(false);
    const fg = this.add.rectangle(x - 17, y - 34, 34, 4, 0xef4444).setOrigin(0, 0.5).setDepth(9).setVisible(false);
    this.enemyHpBars.set(sprite, { bg, fg });
  }

  private spawnPickup(kind: "health" | "cell", x: number, y: number) {
    const sprite = this.pickups.create(x, y, kind === "health" ? "pickup-health" : "pickup-cell") as EnemySprite;
    sprite.setData("kind", kind);
    sprite.setCollideWorldBounds(true);
    sprite.setDepth(7);
    this.physics.add.collider(sprite, this.solidGround);
    this.physics.add.collider(sprite, this.oneWayPlatforms);

    // Nhấp nhô + lấp lánh cho dễ thấy.
    this.tweens.add({
      targets: sprite,
      scale: { from: 0.9, to: 1.15 },
      duration: 620,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });
    const glow = this.add.image(x, y, "glow");
    glow
      .setDisplaySize(90, 90)
      .setTint(kind === "health" ? 0x4ade80 : 0x4fd1c5)
      .setAlpha(0.35)
      .setDepth(6)
      .setBlendMode(Phaser.BlendModes.ADD);
    sprite.setData("glow", glow);
  }

  private setupCamera() {
    const cam = this.cameras.main;
    cam.setBounds(0, 0, this.worldWidth, WORLD_HEIGHT);
    cam.startFollow(this.player, true, 0.11, 0.13);
    // Deadzone: camera chỉ nhích khi nhân vật ra khỏi ô giữa này → đỡ rung
    // mắt khi chạy qua lại tại chỗ.
    cam.setDeadzone(150, 110);
  }

  private setupInput() {
    const kb = this.input.keyboard!;
    this.cursors = kb.createCursorKeys();
    const K = Phaser.Input.Keyboard.KeyCodes;
    this.keys = {
      a: kb.addKey(K.A),
      d: kb.addKey(K.D),
      w: kb.addKey(K.W),
      s: kb.addKey(K.S),
      dash: kb.addKey(K.SHIFT),
      attack: kb.addKey(K.J),
      one: kb.addKey(K.ONE),
      two: kb.addKey(K.TWO),
      three: kb.addKey(K.THREE),
    };

    // Chặn hành vi mặc định của trình duyệt cho các phím điều khiển — nếu
    // không, Space/↑/↓ sẽ **cuộn trang** thay vì điều khiển nhân vật.
    kb.addCapture("LEFT,RIGHT,UP,DOWN,SPACE,SHIFT,J,K,A,D,W,S,ONE,TWO,THREE");

    this.input.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
      if (this.upgradeOpen) return;
      if (pointer.y > 90) this.tryAttack();
    });

    if (this.sys.game.device.input.touch) this.createTouchControls();
  }

  // ================== cảm giác di chuyển ==================

  private trackGroundState(now: number, onGround: boolean, body: Phaser.Physics.Arcade.Body) {
    if (onGround) {
      this.lastOnGroundAt = now;
      this.jumpsUsed = 0;
      this.airDashUsed = false;
    }
    // Vừa chạm đất: nhún người + bụi + bóp sprite. Rơi càng nhanh càng mạnh.
    if (onGround && !this.wasOnGround) {
      const impact = Math.min(1, Math.abs(body.velocity.y || 0) / 900);
      this.landRecoveryUntil = now + LAND_RECOVERY_MS;
      puffDust(this, this.player.x, this.player.y + 26, 6 + Math.round(impact * 6), 90 + impact * 90);
      squash(this, this.player, 1 + impact * 0.28, 1 - impact * 0.24, 150);
      if (impact > 0.55) this.cameras.main.shake(90, 0.004 * impact);
    }
    this.wasOnGround = onGround;
  }

  /** Rơi nặng hơn lúc bay lên, và nhả phím nhảy sớm thì rơi sớm (variable jump). */
  private applyGravityFeel(body: Phaser.Physics.Arcade.Body) {
    if (this.isDashing) return;
    const holdingJump = this.cursors.up.isDown || this.cursors.space.isDown || this.keys.w.isDown;
    body.setGravityY(BASE_GRAVITY * (gravityScaleFor(body.velocity.y, holdingJump) - 1));
  }

  private handleMovement(onGround: boolean) {
    const left = this.cursors.left.isDown || this.keys.a.isDown || this.touch.left;
    const right = this.cursors.right.isDown || this.keys.d.isDown || this.touch.right;
    const speed = BASE_SPEED * this.stats.speedMultiplier;

    // Đang trong pha nhún khi hạ đất thì chậm lại (nhưng vẫn điều khiển được,
    // và lướt/nhảy huỷ được pha này — xem handleDash/handleJumpAndDrop).
    const inLandRecovery = this.time.now < this.landRecoveryUntil && onGround;
    const factor = inLandRecovery ? 0.45 : 1;

    if (left === right) {
      this.player.setVelocityX(0);
    } else if (left) {
      this.player.setVelocityX(-speed * factor);
      this.facing = -1;
      this.player.setFlipX(true);
    } else {
      this.player.setVelocityX(speed * factor);
      this.facing = 1;
      this.player.setFlipX(false);
    }
  }

  private handleJumpAndDrop(now: number, onGround: boolean, body: Phaser.Physics.Arcade.Body) {
    const jumpJustPressed =
      Phaser.Input.Keyboard.JustDown(this.cursors.up) ||
      Phaser.Input.Keyboard.JustDown(this.cursors.space) ||
      Phaser.Input.Keyboard.JustDown(this.keys.w) ||
      this.touch.jump;
    if (jumpJustPressed) this.lastJumpPressedAt = now;

    const holdingDown = this.cursors.down.isDown || this.keys.s.isDown || this.touch.down;

    // Giữ ↓ + nhảy khi đang đứng trên bệ đá lửng → tụt xuống dưới.
    if (jumpJustPressed && holdingDown && onGround) {
      this.dropThroughUntil = now + DROP_THROUGH_MS;
      this.lastJumpPressedAt = -9999;
      puffDust(this, this.player.x, this.player.y + 26, 5, 60);
      return;
    }

    const kind = decideJump({
      now,
      lastOnGroundAt: this.lastOnGroundAt,
      lastJumpPressedAt: this.lastJumpPressedAt,
      onGround,
      jumpsUsed: this.jumpsUsed,
      maxJumps: 2,
    });

    if (kind !== "none") {
      // Nhảy huỷ được đòn đánh và pha nhún khi hạ đất.
      this.attackActiveUntil = 0;
      this.attackRecoveryUntil = 0;
      this.landRecoveryUntil = 0;
      this.lastJumpPressedAt = -9999;

      if (kind === "ground") {
        this.player.setVelocityY(JUMP_VELOCITY);
        this.jumpsUsed = 1;
        puffDust(this, this.player.x, this.player.y + 26, 5, 70);
      } else {
        this.player.setVelocityY(DOUBLE_JUMP_VELOCITY);
        this.jumpsUsed = 2;
        afterImage(this, this.player);
        puffDust(this, this.player.x, this.player.y + 18, 4, 90);
      }
      squash(this, this.player, 0.8, 1.24, 140);
      return;
    }

    // Nhả phím sớm → cắt lực nhảy để nhảy thấp (variable jump height).
    const releasedJump =
      Phaser.Input.Keyboard.JustUp(this.cursors.up) ||
      Phaser.Input.Keyboard.JustUp(this.cursors.space) ||
      Phaser.Input.Keyboard.JustUp(this.keys.w);
    if (releasedJump) this.player.setVelocityY(cutJumpVelocity(body.velocity.y));
  }

  /**
   * Lướt: dùng được cả trên mặt đất và trên không (mỗi lần rời đất thêm 1 lần
   * lướt). Lướt **huỷ** được đòn đánh và pha nhún khi hạ đất, nên có thể nối
   * đánh → lướt → nhảy liên tục mà không bị kẹt animation.
   */
  private handleDash(now: number, onGround: boolean) {
    const dashPressed = Phaser.Input.Keyboard.JustDown(this.keys.dash) || this.touch.dash;
    this.touch.dash = false;
    if (!dashPressed) return;
    if (now < this.dashCooldownUntil) return;
    if (!onGround && this.airDashUsed) return;
    if (!onGround) this.airDashUsed = true;

    this.attackActiveUntil = 0;
    this.attackRecoveryUntil = 0;
    this.landRecoveryUntil = 0;

    this.isDashing = true;
    this.dashEndsAt = now + DASH_DURATION_MS;
    this.dashCooldownUntil = now + BASE_DASH_COOLDOWN_MS * this.stats.dashCooldownMultiplier;
    // Bất tử suốt cú lướt + chút đệm → lướt xuyên qua quái để né đòn.
    this.invulnerableUntil = Math.max(this.invulnerableUntil, now + DASH_DURATION_MS + 90);

    const body = this.player.body as Phaser.Physics.Arcade.Body;
    body.setAllowGravity(false);
    this.player.setVelocity(this.facing * DASH_SPEED, 0);
    this.cameras.main.shake(70, 0.003);
    puffDust(this, this.player.x - this.facing * 18, this.player.y + 22, 6, 40);
    for (let i = 0; i < 5; i++) this.time.delayedCall(i * 28, () => !this.runEnded && afterImage(this, this.player));
  }

  private endDash() {
    this.isDashing = false;
    const body = this.player.body as Phaser.Physics.Arcade.Body;
    body.setAllowGravity(true);
    // Giữ lại một phần đà để nối "lướt → nhảy" thành cú nhảy xa.
    body.setVelocityX(body.velocity.x * 0.55);
  }

  private handleAttack(now: number) {
    const pressed = Phaser.Input.Keyboard.JustDown(this.keys.attack) || this.touch.attack;
    this.touch.attack = false;
    if (pressed) this.tryAttack();
    void now;
  }

  private tryAttack() {
    if (this.runEnded || this.upgradeOpen) return;
    const now = this.time.now;
    if (now < this.attackRecoveryUntil) return;
    if (now > this.comboWindowEndsAt) this.comboIndex = 0;

    // Đánh huỷ được pha nhún khi hạ đất → hạ đất là đánh luôn, không phải chờ.
    this.landRecoveryUntil = 0;

    const speedUp = this.stats.attackSpeedMultiplier;
    this.attackHitThisSwing.clear();
    this.activeSwingComboIndex = this.comboIndex;
    this.attackActiveUntil = now + ATTACK_ACTIVE_MS / speedUp;
    this.attackRecoveryUntil = now + (ATTACK_ACTIVE_MS + ATTACK_RECOVERY_MS) / speedUp;
    this.comboWindowEndsAt = now + PLAYER_WEAPON.comboWindowMs;

    this.spawnSlash(this.comboIndex);
    // Đòn thứ 3 (đòn kết) đẩy nhân vật lên trước một nhịp cho ra sức nặng.
    if (this.comboIndex === PLAYER_WEAPON.comboHits - 1) {
      const body = this.player.body as Phaser.Physics.Arcade.Body;
      body.setVelocityX(body.velocity.x + this.facing * 140);
    }
    this.comboIndex = (this.comboIndex + 1) % PLAYER_WEAPON.comboHits;
  }

  private spawnSlash(comboIndex: number) {
    const isFinisher = comboIndex === PLAYER_WEAPON.comboHits - 1;
    const slash = this.add.image(this.player.x + this.facing * ATTACK_REACH, this.player.y, `slash-${comboIndex}`);
    slash
      .setFlipX(this.facing < 0)
      .setDepth(30)
      .setBlendMode(Phaser.BlendModes.ADD)
      .setAlpha(0.95)
      .setScale(0.7, 0.9)
      .setAngle(isFinisher ? (this.facing > 0 ? 12 : -12) : 0);

    this.tweens.add({
      targets: slash,
      scaleX: isFinisher ? 1.25 : 1.05,
      scaleY: isFinisher ? 1.2 : 1,
      alpha: 0,
      duration: 170,
      ease: "Quad.easeOut",
      onComplete: () => slash.destroy(),
    });
  }

  private checkAttackHit() {
    const hitbox = new Phaser.Geom.Rectangle(
      this.facing > 0 ? this.player.x + 6 : this.player.x - 6 - PLAYER_WEAPON.rangePx,
      this.player.y - ATTACK_HEIGHT / 2,
      PLAYER_WEAPON.rangePx,
      ATTACK_HEIGHT
    );
    this.enemies.getChildren().forEach((obj) => {
      const enemy = obj as EnemySprite;
      if (!enemy.active || this.attackHitThisSwing.has(enemy)) return;
      if (!Phaser.Geom.Rectangle.Overlaps(hitbox, enemy.getBounds())) return;
      this.attackHitThisSwing.add(enemy);
      const raw = comboDamage(PLAYER_WEAPON.damagePerHit, this.activeSwingComboIndex);
      this.damageEnemy(enemy, raw * this.stats.damageMultiplier);
    });
  }

  private updatePlayerAnimation(now: number, onGround: boolean, velocityY: number) {
    // Chỉ "hero-run" là animation nhiều khung; các dáng còn lại là 1 khung
    // tĩnh nên phải stop() trước khi setTexture, kẻo animation ghi đè lại.
    const setPose = (key: string) => {
      this.player.anims.stop();
      this.player.setTexture(key);
    };

    if (this.isDashing) return setPose("hero-dash");
    if (this.attackActiveUntil > now) return setPose(onGround ? "hero-attack" : "hero-air-attack");
    if (!onGround) return setPose(velocityY < 0 ? "hero-jump" : "hero-fall");
    if (now < this.landRecoveryUntil) return setPose("hero-land");

    const movingX = Math.abs((this.player.body as Phaser.Physics.Arcade.Body).velocity.x) > 12;
    if (movingX) {
      this.player.anims.play("hero-run", true);
    } else {
      setPose("hero-idle");
    }
  }

  /** Nền 1 chiều: chỉ đứng lên được khi đang rơi từ phía trên và không trong lúc tụt xuống. */
  private shouldLandOnPlatform(player: Phaser.Physics.Arcade.Sprite, platform: Phaser.Physics.Arcade.Sprite): boolean {
    if (this.time.now < this.dropThroughUntil) return false;
    const body = player.body as Phaser.Physics.Arcade.Body;
    const platformTop = (platform.body as Phaser.Physics.Arcade.StaticBody).top;
    return body.velocity.y >= 0 && body.bottom <= platformTop + 10;
  }

  // ================== quái ==================

  private updateEnemies(now: number) {
    this.enemies.getChildren().forEach((obj) => {
      const enemy = obj as EnemySprite;
      if (!enemy.active) return;
      const kind = enemy.getData("kind") as EnemyKind;
      const stats = ENEMY_STATS[kind];
      const dx = this.player.x - enemy.x;
      const body = enemy.body as Phaser.Physics.Arcade.Body;

      // Quái rơi xuống vực: coi như bị hạ. Nếu không, nó nằm dưới đáy thế giới
      // mà vẫn "còn sống" → phòng không bao giờ dọn sạch → cổng không mở →
      // người chơi kẹt cứng không đi tiếp được.
      if (enemy.y > WORLD_HEIGHT + 80) {
        this.killEnemy(enemy);
        return;
      }

      if (kind === "walker") {
        this.updateWalker(enemy, now, dx, body, stats.speed);
      } else if (kind === "shooter") {
        enemy.setVelocityX(0);
        this.updateShooter(enemy, now, dx);
      } else {
        this.updateBoss(enemy, now, dx, body);
      }

      const bar = this.enemyHpBars.get(enemy);
      if (bar) {
        const hp = enemy.getData("hp") as number;
        const maxHp = enemy.getData("maxHp") as number;
        const wounded = hp < maxHp;
        bar.bg.setVisible(wounded);
        bar.fg.setVisible(wounded);
        if (wounded) {
          const barY = enemy.y - (kind === "boss" ? 52 : 34);
          bar.bg.setPosition(enemy.x, barY);
          bar.fg.setPosition(enemy.x - 17, barY);
          bar.fg.width = Math.max(0, 34 * (hp / maxHp));
        }
      }
    });
  }

  /**
   * Quái đi tuần **không** gây sát thương khi chỉ đụng phải. Nó phải nhá đòn
   * (đứng lại, sáng vàng) rồi lao tới, và chỉ trong lúc lao mới gây sát thương.
   *
   * Trước đây chạm là mất máu, nghĩa là muốn đánh trúng thì buộc phải vào tầm
   * chạm → luôn phải đổi máu, đánh nhau không có cách né. Kiểm thử tự động chết
   * trong 12 giây ở phòng đầu vì lỗi thiết kế này.
   */
  private updateWalker(
    enemy: EnemySprite,
    now: number,
    dx: number,
    body: Phaser.Physics.Arcade.Body,
    speed: number
  ) {
    const lungeUntil = (enemy.getData("lungeUntil") as number) ?? 0;
    const telegraphUntil = (enemy.getData("telegraphUntil") as number) ?? 0;
    const nextAttackAt = (enemy.getData("nextAttackAt") as number) ?? 0;
    enemy.setFlipX(dx < 0);

    // Đang lao tới: giữ nguyên đà, đây là cửa sổ duy nhất gây sát thương.
    if (now < lungeUntil) return;

    if (telegraphUntil > 0) {
      enemy.setVelocityX(0);
      if (now >= telegraphUntil) {
        enemy.setData("telegraphUntil", 0);
        enemy.setData("lungeUntil", now + WALKER_LUNGE_MS);
        enemy.setData("nextAttackAt", now + WALKER_ATTACK_COOLDOWN_MS);
        enemy.clearTint();
        enemy.setVelocityX(Math.sign(dx || 1) * WALKER_LUNGE_SPEED);
      }
      return;
    }

    const inStrikeRange = Math.abs(dx) < WALKER_STRIKE_RANGE;
    if (inStrikeRange && now >= nextAttackAt) {
      enemy.setData("telegraphUntil", now + WALKER_TELEGRAPH_MS);
      enemy.setTint(0xffd166);
      enemy.setVelocityX(0);
      return;
    }

    if (Math.abs(dx) < WALKER_AGGRO_RANGE) {
      enemy.setVelocityX(Math.sign(dx) * speed);
      return;
    }

    let dir = enemy.getData("patrolDir") as number;
    const spawnX = enemy.getData("spawnX") as number;
    // Quay đầu khi chạm tường hoặc đi quá tầm tuần.
    if (body.blocked.right || enemy.x > spawnX + WALKER_PATROL_RANGE) dir = -1;
    if (body.blocked.left || enemy.x < spawnX - WALKER_PATROL_RANGE) dir = 1;
    enemy.setData("patrolDir", dir);
    enemy.setVelocityX(dir * speed * 0.55);
    enemy.setFlipX(dir < 0);
  }

  /** Quái bắn xa: nhá đòn (telegraph) trước khi bắn để người chơi kịp né. */
  private updateShooter(enemy: EnemySprite, now: number, dx: number) {
    if (Math.abs(dx) >= SHOOTER_RANGE) return;
    enemy.setFlipX(dx < 0);
    const lastShot = enemy.getData("lastShotAt") as number;
    const telegraphUntil = enemy.getData("telegraphUntil") as number;

    if (telegraphUntil > 0) {
      if (now >= telegraphUntil) {
        enemy.setData("telegraphUntil", 0);
        enemy.setData("lastShotAt", now);
        enemy.clearTint();
        enemy.setScale(1);
        this.fireProjectile(enemy.x, enemy.y, Math.sign(dx) || 1);
      }
      return;
    }

    if (now - lastShot > SHOOTER_INTERVAL_MS) {
      enemy.setData("telegraphUntil", now + SHOOTER_TELEGRAPH_MS);
      enemy.setTint(0xffd166);
      this.tweens.add({ targets: enemy, scale: 1.25, duration: SHOOTER_TELEGRAPH_MS, ease: "Quad.easeIn" });
    }
  }

  /**
   * Trùm cuối có 3 pha luân phiên: đuổi → nhá đòn rồi nhảy đè → bắn loạt 3
   * viên. Nhá đòn (đỏ rực + đứng lại) là để đánh trùm có nhịp đọc đòn chứ
   * không chỉ là bao thịt đi tới.
   */
  private updateBoss(boss: EnemySprite, now: number, dx: number, body: Phaser.Physics.Arcade.Body) {
    const phase = boss.getData("bossPhase") as string;
    const nextAt = boss.getData("bossNextActionAt") as number;
    const stats = ENEMY_STATS.boss;
    boss.setFlipX(dx < 0);

    if (phase === "chase") {
      boss.setVelocityX(Math.sign(dx) * stats.speed);
      if (now >= nextAt) {
        boss.setData("bossPhase", Math.random() < 0.5 ? "windup-leap" : "windup-volley");
        boss.setData("bossNextActionAt", now + 620);
        boss.setTint(0xff5544);
        boss.setVelocityX(0);
      }
      return;
    }

    if (phase === "windup-leap") {
      boss.setVelocityX(0);
      if (now >= nextAt) {
        boss.clearTint();
        boss.setData("bossPhase", "leap");
        boss.setData("bossNextActionAt", now + 1500);
        boss.setVelocity(Math.sign(dx) * 300, -720);
        this.cameras.main.shake(120, 0.005);
      }
      return;
    }

    if (phase === "leap") {
      if (body.blocked.down && now >= nextAt - 1100) {
        // Chạm đất sau cú nhảy: nện đất, rung màn, bụi bay.
        this.cameras.main.shake(220, 0.012);
        puffDust(this, boss.x, boss.y + 30, 16, 220);
        boss.setData("bossPhase", "chase");
        boss.setData("bossNextActionAt", now + 1600);
      }
      return;
    }

    if (phase === "windup-volley") {
      boss.setVelocityX(0);
      if (now >= nextAt) {
        boss.clearTint();
        const dir = Math.sign(dx) || 1;
        for (let i = 0; i < 3; i++) {
          this.time.delayedCall(i * 180, () => {
            if (boss.active && !this.runEnded) this.fireProjectile(boss.x, boss.y - 14 + i * 12, dir);
          });
        }
        boss.setData("bossPhase", "chase");
        boss.setData("bossNextActionAt", now + 1800);
      }
    }
  }

  private fireProjectile(x: number, y: number, dir: number) {
    const proj = this.projectiles.create(x + dir * 22, y, "projectile") as EnemySprite;
    proj.setVelocityX(dir * PROJECTILE_SPEED);
    proj.setData("spawnX", x);
    proj.setDepth(20);
    proj.setBlendMode(Phaser.BlendModes.ADD);
    this.tweens.add({ targets: proj, angle: 360, duration: 600, repeat: -1 });
    this.time.delayedCall(2600, () => proj.active && proj.destroy());
  }

  private updateProjectiles() {
    this.projectiles.getChildren().forEach((obj) => {
      const proj = obj as EnemySprite;
      if (proj.active && (proj.x < -100 || proj.x > this.worldWidth + 100)) proj.destroy();
    });
  }

  // ================== sát thương ==================

  private damageEnemy(enemy: EnemySprite, damage: number) {
    const hp = Math.max(0, (enemy.getData("hp") as number) - damage);
    enemy.setData("hp", hp);

    const isFinisher = this.activeSwingComboIndex === PLAYER_WEAPON.comboHits - 1;
    enemy.setTint(0xffffff).setTintMode(Phaser.TintModes.FILL);
    this.time.delayedCall(80, () => enemy.active && enemy.clearTint());

    const dir = knockbackDirection(enemy.x, this.player.x);
    enemy.setVelocityX(dir * (isFinisher ? 320 : 190));

    hitstop(this, damage, () => !this.upgradeOpen && !this.runEnded);
    this.cameras.main.shake(isFinisher ? 130 : 60, isFinisher ? 0.007 : 0.003);
    burstSparks(this, enemy.x, enemy.y, isFinisher ? 0xffe9a8 : 0xffffff, isFinisher ? 16 : 9);
    floatDamageNumber(this, enemy.x, enemy.y - 26, damage, isFinisher);

    if (hp <= 0) this.killEnemy(enemy);
  }

  private killEnemy(enemy: EnemySprite) {
    const kind = enemy.getData("kind") as EnemyKind;
    const roomIndex = enemy.getData("roomIndex") as number;
    const { x, y } = enemy;

    const bar = this.enemyHpBars.get(enemy);
    bar?.bg.destroy();
    bar?.fg.destroy();
    this.enemyHpBars.delete(enemy);
    burstDeath(this, x, y, kind === "shooter" ? 0x8b6fd8 : 0x9c2a38);
    enemy.destroy();

    if (this.stats.lifestealPerKill > 0) {
      this.hp = Math.min(this.stats.maxHp, this.hp + this.stats.lifestealPerKill);
      floatDamageNumber(this, this.player.x, this.player.y - 40, this.stats.lifestealPerKill, false);
    }

    this.roomEnemyCounts[roomIndex] = Math.max(0, this.roomEnemyCounts[roomIndex] - 1);
    if (Math.random() < 0.5) this.spawnPickup(Math.random() < 0.35 ? "health" : "cell", x, y - 20);

    if (kind === "boss") {
      this.finishRun(true);
      return;
    }
    if (this.roomEnemyCounts[roomIndex] === 0) this.onRoomCleared(roomIndex);
  }

  private onRoomCleared(roomIndex: number) {
    this.openGate(roomIndex);
    if (this.roomUpgradeOffered[roomIndex]) return;
    this.roomUpgradeOffered[roomIndex] = true;
    announce(this, "Dọn sạch phòng!\nCổng đã mở", "#4ade80");
    this.time.delayedCall(700, () => !this.runEnded && this.openUpgradePanel());
  }

  private openGate(roomIndex: number) {
    const gate = this.gates
      .getChildren()
      .find((g) => (g as Phaser.GameObjects.Sprite).getData("guardsRoomIndex") === roomIndex) as
      | Phaser.Physics.Arcade.Sprite
      | undefined;
    if (!gate || gate.getData("locked") !== true) return;
    gate.setData("locked", false);
    this.tweens.add({
      targets: gate,
      alpha: 0,
      y: gate.y - 40,
      duration: 420,
      ease: "Quad.easeIn",
      onComplete: () => gate.destroy(),
    });
  }

  private onEnemyContact(enemy: EnemySprite) {
    if (!enemy.active || this.runEnded) return;
    const now = this.time.now;
    if (now < this.invulnerableUntil) return;
    const kind = enemy.getData("kind") as EnemyKind;

    // Chỉ đau khi quái đang thực sự ra đòn (đang lao tới). Trùm là ngoại lệ —
    // thân nó to và nặng nên đụng vào vẫn mất máu.
    const lungeUntil = (enemy.getData("lungeUntil") as number) ?? 0;
    const isStriking = kind === "boss" || now < lungeUntil;
    if (!isStriking) return;

    const lastContact = enemy.getData("lastContactAt") as number;
    if (now - lastContact < ENEMY_STATS[kind].contactCooldownMs) return;
    enemy.setData("lastContactAt", now);
    this.damagePlayer(ENEMY_STATS[kind].damage, knockbackDirection(this.player.x, enemy.x));
  }

  private onProjectileHit(proj: EnemySprite) {
    if (!proj.active || this.runEnded) return;
    burstSparks(this, proj.x, proj.y, 0xf2b84b, 6);
    proj.destroy();
    if (this.time.now < this.invulnerableUntil) return;
    this.damagePlayer(6, knockbackDirection(this.player.x, proj.getData("spawnX") as number));
  }

  private onPickup(pickup: EnemySprite) {
    if (!pickup.active) return;
    const kind = pickup.getData("kind") as "health" | "cell";
    if (kind === "health") {
      this.hp = Math.min(this.stats.maxHp, this.hp + 30);
      floatDamageNumber(this, this.player.x, this.player.y - 40, 30, false);
    } else {
      this.cellsCollected += 1;
    }
    burstSparks(this, pickup.x, pickup.y, kind === "health" ? 0x4ade80 : 0x4fd1c5, 8);
    (pickup.getData("glow") as Phaser.GameObjects.Image | undefined)?.destroy();
    pickup.destroy();
  }

  private damagePlayer(damage: number, knockDir: 1 | -1) {
    this.hp = Math.max(0, this.hp - damage);
    this.invulnerableUntil = this.time.now + PLAYER_IFRAME_MS;
    this.player.setVelocity(knockDir * -240, -270);
    this.cameras.main.shake(160, 0.01);
    flashDamageEdges(this);
    hitstop(this, damage, () => !this.upgradeOpen && !this.runEnded);
    burstSparks(this, this.player.x, this.player.y, 0xe8615c, 10);
    if (this.hp <= 0) this.killPlayer();
  }

  private killPlayer() {
    this.finishRun(false);
  }

  private finishRun(isVictory: boolean) {
    if (this.runEnded) return;
    this.runEnded = true;
    if (this.physics.world.isPaused) this.physics.world.resume();
    this.closeUpgradePanel();

    this.player.setVelocity(0, 0);
    (this.player.body as Phaser.Physics.Arcade.Body).setAllowGravity(false);
    this.player.setTint(isVictory ? 0xffe08a : 0x555555);
    if (isVictory) {
      burstSparks(this, this.player.x, this.player.y, 0xffe08a, 24);
      this.cameras.main.flash(300, 240, 220, 150);
    }

    const payload: RunEventPayload = {
      roomsCleared: Math.min(this.currentRoomIndex + 1, this.roomTemplates.length),
      cellsCollected: this.cellsCollected,
      timeMs: Math.round(this.time.now - this.runStartTime),
      isVictory,
    };
    const onRunEvent = this.registry.get("onRunEvent") as
      | ((type: "gameover" | "victory", payload: RunEventPayload) => void)
      | undefined;
    onRunEvent?.(isVictory ? "victory" : "gameover", payload);
  }

  // ================== bảng chọn buff ==================

  private openUpgradePanel() {
    if (this.upgradeOpen || this.runEnded) return;
    this.upgradeOpen = true;
    this.physics.world.pause();
    this.upgradeChoices = rollUpgradeChoices(Date.now() ^ Math.floor(Math.random() * 1e9), 3);

    const cam = this.cameras.main;
    const overlay = this.add
      .rectangle(0, 0, cam.width, cam.height, 0x0b0806, 0.82)
      .setOrigin(0, 0)
      .setScrollFactor(0)
      .setDepth(130);
    const title = this.add
      .text(cam.width / 2, 96, "CHỌN MỘT SỨC MẠNH", {
        fontFamily: "monospace",
        fontSize: "22px",
        color: "#f2b84b",
        stroke: "#14100c",
        strokeThickness: 5,
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(131);
    this.upgradeNodes = [overlay, title];

    const cardW = 220;
    const gap = 26;
    const totalW = this.upgradeChoices.length * cardW + (this.upgradeChoices.length - 1) * gap;
    const startX = cam.width / 2 - totalW / 2;

    this.upgradeChoices.forEach((upgrade, i) => {
      const x = startX + i * (cardW + gap);
      const card = this.add
        .rectangle(x, 150, cardW, 170, 0x1f1813)
        .setOrigin(0, 0)
        .setStrokeStyle(2, 0x44557a)
        .setScrollFactor(0)
        .setDepth(131)
        .setInteractive({ useHandCursor: true });

      const keyHint = this.add
        .text(x + cardW / 2, 172, `[${i + 1}]`, { fontFamily: "monospace", fontSize: "16px", color: "#4fd1c5" })
        .setOrigin(0.5)
        .setScrollFactor(0)
        .setDepth(132);
      const name = this.add
        .text(x + cardW / 2, 212, upgrade.name, { fontFamily: "monospace", fontSize: "20px", color: "#ffffff" })
        .setOrigin(0.5)
        .setScrollFactor(0)
        .setDepth(132);
      const desc = this.add
        .text(x + cardW / 2, 258, upgrade.description, {
          fontFamily: "monospace",
          fontSize: "14px",
          color: "#b9b0a4",
          align: "center",
          wordWrap: { width: cardW - 28 },
        })
        .setOrigin(0.5, 0)
        .setScrollFactor(0)
        .setDepth(132);

      card.on("pointerover", () => card.setStrokeStyle(2, 0xf2b84b));
      card.on("pointerout", () => card.setStrokeStyle(2, 0x44557a));
      card.on("pointerdown", () => this.chooseUpgrade(upgrade.id));

      this.upgradeNodes.push(card, keyHint, name, desc);
    });
  }

  private handleUpgradeInput() {
    const picks: Array<[Phaser.Input.Keyboard.Key, number]> = [
      [this.keys.one, 0],
      [this.keys.two, 1],
      [this.keys.three, 2],
    ];
    for (const [key, index] of picks) {
      if (Phaser.Input.Keyboard.JustDown(key) && this.upgradeChoices[index]) {
        this.chooseUpgrade(this.upgradeChoices[index].id);
        return;
      }
    }
  }

  private chooseUpgrade(id: UpgradeId) {
    if (!this.upgradeOpen) return;
    const { stats, healAmount } = applyUpgrade(this.stats, id);
    this.stats = stats;
    if (healAmount > 0) {
      this.hp = Math.min(this.stats.maxHp, this.hp + healAmount);
      floatDamageNumber(this, this.player.x, this.player.y - 40, healAmount, true);
    }
    this.closeUpgradePanel();
    const chosen = this.upgradeChoices.find((u) => u.id === id);
    if (chosen) announce(this, `${chosen.name}\n${chosen.description}`, "#4fd1c5");
  }

  private closeUpgradePanel() {
    if (!this.upgradeOpen) return;
    this.upgradeOpen = false;
    this.upgradeNodes.forEach((node) => node.destroy());
    this.upgradeNodes = [];
    if (!this.runEnded) this.physics.world.resume();
  }

  // ================== HUD ==================

  private buildHud() {
    this.add
      .text(14, 12, "← → di chuyển · Space nhảy (đôi) · Shift lướt · J đánh · ↓+Space tụt xuống", {
        fontFamily: "monospace",
        fontSize: "12px",
        color: "#b9b0a4",
        backgroundColor: "#0b0806aa",
        padding: { x: 7, y: 4 },
      })
      .setScrollFactor(0)
      .setDepth(100);

    this.add.rectangle(14, 44, 220, 18, 0x14100c).setOrigin(0, 0.5).setScrollFactor(0).setDepth(100);
    this.hpBarFg = this.add
      .rectangle(16, 44, 216, 14, 0xe8615c)
      .setOrigin(0, 0.5)
      .setScrollFactor(0)
      .setDepth(101);
    this.hpBarLabel = this.add
      .text(20, 44, "", { fontFamily: "monospace", fontSize: "12px", color: "#ffffff" })
      .setOrigin(0, 0.5)
      .setScrollFactor(0)
      .setDepth(102);

    this.add
      .text(14, 66, "LƯỚT", { fontFamily: "monospace", fontSize: "11px", color: "#b9b0a4" })
      .setScrollFactor(0)
      .setDepth(101);
    this.add.rectangle(58, 71, 84, 8, 0x14100c).setOrigin(0, 0.5).setScrollFactor(0).setDepth(100);
    this.dashPip = this.add.rectangle(59, 71, 82, 6, 0x4fd1c5).setOrigin(0, 0.5).setScrollFactor(0).setDepth(101);

    this.roomText = this.add
      .text(0, 12, "", {
        fontFamily: "monospace",
        fontSize: "14px",
        color: "#f2b84b",
        backgroundColor: "#0b0806aa",
        padding: { x: 7, y: 4 },
      })
      .setScrollFactor(0)
      .setDepth(100);
    this.cellsText = this.add
      .text(0, 40, "", {
        fontFamily: "monospace",
        fontSize: "14px",
        color: "#4fd1c5",
        backgroundColor: "#0b0806aa",
        padding: { x: 7, y: 4 },
      })
      .setScrollFactor(0)
      .setDepth(100);
  }

  private updateHud(now: number) {
    const hpRatio = Phaser.Math.Clamp(this.hp / this.stats.maxHp, 0, 1);
    this.hpBarFg.width = 216 * hpRatio;
    this.hpBarFg.fillColor = hpRatio > 0.5 ? 0x4ade80 : hpRatio > 0.25 ? 0xf2b84b : 0xe8615c;
    this.hpBarLabel.setText(`${Math.ceil(this.hp)} / ${this.stats.maxHp}`);

    const cooldownLeft = Math.max(0, this.dashCooldownUntil - now);
    const cooldownTotal = BASE_DASH_COOLDOWN_MS * this.stats.dashCooldownMultiplier;
    const ready = cooldownLeft <= 0;
    this.dashPip.width = 82 * (ready ? 1 : 1 - cooldownLeft / cooldownTotal);
    this.dashPip.fillColor = ready ? 0x4fd1c5 : 0x44557a;

    this.currentRoomIndex = this.roomBoundaries.filter((b) => this.player.x >= b).length;
    const roomLabel = Math.min(this.currentRoomIndex + 1, this.roomTemplates.length);
    const cam = this.cameras.main;
    const inBossRoom = this.currentRoomIndex === this.roomTemplates.length - 1;
    this.roomText.setText(inBossRoom ? "PHÒNG TRÙM" : `Phòng ${roomLabel}/${this.roomTemplates.length}`);
    this.roomText.setPosition(cam.width - this.roomText.width - 14, 12);
    this.cellsText.setText(`◆ ${this.cellsCollected}`);
    this.cellsText.setPosition(cam.width - this.cellsText.width - 14, 40);

    if (inBossRoom && !this.announcedBossRoom) {
      this.announcedBossRoom = true;
      announce(this, "CỰ VỆ GAI", "#ff5544");
    }
    if (inBossRoom) this.updateBossBar();
  }

  private updateBossBar() {
    const boss = this.enemies.getChildren().find((e) => (e as EnemySprite).getData("kind") === "boss") as
      | EnemySprite
      | undefined;
    if (!boss?.active) return;
    const cam = this.cameras.main;
    if (!this.bossBarFg) {
      this.add.rectangle(cam.width / 2 - 170, cam.height - 42, 340, 18, 0x14100c).setOrigin(0, 0.5).setScrollFactor(0).setDepth(100);
      this.bossBarFg = this.add
        .rectangle(cam.width / 2 - 168, cam.height - 42, 336, 14, 0x8b1a1a)
        .setOrigin(0, 0.5)
        .setScrollFactor(0)
        .setDepth(101);
      this.add
        .text(cam.width / 2, cam.height - 62, "CỰ VỆ GAI", {
          fontFamily: "monospace",
          fontSize: "13px",
          color: "#ff8877",
        })
        .setOrigin(0.5)
        .setScrollFactor(0)
        .setDepth(101);
    }
    const hp = boss.getData("hp") as number;
    const maxHp = boss.getData("maxHp") as number;
    this.bossBarFg.width = Math.max(0, 336 * (hp / maxHp));
  }

  // ================== điều khiển cảm ứng ==================

  private createTouchControls() {
    const cam = this.cameras.main;
    const makeButton = (x: number, y: number, label: string, size = 58) => {
      const zone = this.add
        .rectangle(x, y, size, size, 0xffffff, 0.14)
        .setScrollFactor(0)
        .setDepth(105)
        .setStrokeStyle(1, 0xffffff, 0.3)
        .setInteractive();
      this.add
        .text(x, y, label, { fontFamily: "monospace", fontSize: "19px", color: "#ffffff" })
        .setOrigin(0.5)
        .setScrollFactor(0)
        .setDepth(106);
      return zone;
    };

    const hold = (zone: Phaser.GameObjects.Rectangle, set: (v: boolean) => void) => {
      zone.on("pointerdown", () => set(true));
      zone.on("pointerup", () => set(false));
      zone.on("pointerout", () => set(false));
    };

    hold(makeButton(48, cam.height - 48, "◀"), (v) => (this.touch.left = v));
    hold(makeButton(114, cam.height - 48, "▶"), (v) => (this.touch.right = v));
    hold(makeButton(180, cam.height - 48, "▼"), (v) => (this.touch.down = v));
    makeButton(cam.width - 48, cam.height - 48, "▲").on("pointerdown", () => (this.touch.jump = true));
    makeButton(cam.width - 114, cam.height - 48, "⚔").on("pointerdown", () => (this.touch.attack = true));
    makeButton(cam.width - 48, cam.height - 114, "⚡").on("pointerdown", () => (this.touch.dash = true));
  }

  // ================== reset ==================

  private resetRunState() {
    this.stats = createBaseStats();
    this.hp = this.stats.maxHp;
    this.facing = 1;
    this.jumpsUsed = 0;
    this.lastJumpPressedAt = -9999;
    this.wasOnGround = true;
    this.landRecoveryUntil = 0;
    this.dropThroughUntil = 0;
    this.isDashing = false;
    this.airDashUsed = false;
    this.dashCooldownUntil = 0;
    this.invulnerableUntil = 0;
    this.comboIndex = 0;
    this.activeSwingComboIndex = 0;
    this.attackActiveUntil = 0;
    this.attackRecoveryUntil = 0;
    this.attackHitThisSwing = new Set();
    this.cellsCollected = 0;
    this.currentRoomIndex = 0;
    this.announcedBossRoom = false;
    this.roomBoundaries = [];
    this.roomEnemyCounts = [];
    this.roomUpgradeOffered = [];
    this.enemyHpBars = new Map();
    this.bossBarFg = undefined;
    this.upgradeOpen = false;
    this.upgradeChoices = [];
    this.upgradeNodes = [];
    this.runEnded = false;
  }
}
