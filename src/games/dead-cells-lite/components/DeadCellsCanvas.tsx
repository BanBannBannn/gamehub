"use client";

import { useCallback, useEffect, useRef } from "react";
import Phaser from "phaser";
import { GameScene } from "../phaser/scenes/GameScene";
import { RunEventPayload } from "../engine/types";

export type RunEventType = "gameover" | "victory";
export type OnRunEvent = (type: RunEventType, payload: RunEventPayload) => void;

/**
 * Mounts the actual Phaser.Game instance. Only ever loaded client-side
 * (via next/dynamic ssr:false in DeadCellsGame.tsx) since Phaser touches
 * `window`/`document` at module scope.
 *
 * React Strict Mode (on by default with the app router since Next 13.5)
 * double-invokes effects in dev, which would otherwise create two
 * `<canvas>` instances stacked on top of each other. `gameRef` guards
 * against that instead of disabling Strict Mode.
 *
 * Game -> React communication (run over / victory) goes through
 * `game.registry` rather than props, since a Phaser Scene can't receive
 * React props directly — the registry value is set right after
 * construction, before the scene's `create()` runs.
 */
export function DeadCellsCanvas({ onRunEvent }: { onRunEvent: OnRunEvent }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<Phaser.Game | null>(null);

  /**
   * Phaser listens for keydown on `window`. The site embeds a third-party ad
   * script (see app/layout.tsx) whose iframe can end up as
   * `document.activeElement` — keystrokes then go to the ad frame and the game
   * appears frozen. Blurring a focused iframe and pulling focus back to the
   * game container makes the controls work again, and re-running this on every
   * pointer interaction means clicking the game always recovers input.
   */
  const reclaimKeyboardFocus = useCallback(() => {
    const active = document.activeElement as HTMLElement | null;
    if (active && active.tagName === "IFRAME") active.blur();
    window.focus();
    containerRef.current?.focus({ preventScroll: true });
  }, []);

  useEffect(() => {
    if (gameRef.current || !containerRef.current) return;

    const game = new Phaser.Game({
      type: Phaser.AUTO,
      parent: containerRef.current,
      backgroundColor: "#150f0c",
      physics: {
        default: "arcade",
        arcade: { gravity: { x: 0, y: 1500 }, debug: false },
      },
      scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        width: 960,
        height: 540,
      },
      // Pixel-art textures: keep edges crisp instead of blurred when scaled.
      pixelArt: true,
      scene: [GameScene],
    });
    game.registry.set("onRunEvent", onRunEvent);
    gameRef.current = game;

    reclaimKeyboardFocus();

    return () => {
      gameRef.current?.destroy(true);
      gameRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      ref={containerRef}
      // tabIndex lets the container hold keyboard focus so a focused ad iframe
      // can be displaced; -1 keeps it out of the normal tab order.
      tabIndex={-1}
      onPointerDown={reclaimKeyboardFocus}
      onMouseEnter={reclaimKeyboardFocus}
      className="aspect-video w-full max-w-3xl overflow-hidden rounded-2xl border border-border-hover outline-none"
    />
  );
}
