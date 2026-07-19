"use client";

import { useEffect, useRef } from "react";

interface PhaserGameProps {
  levelId: string;
}

/**
 * PhaserGame — React wrapper for the Phaser game instance.
 * Phaser requires DOM access so this component is client-only.
 * The game mounts into #phaser-container and is destroyed on unmount.
 */
export default function PhaserGame({ levelId }: PhaserGameProps) {
  const gameRef = useRef<Phaser.Game | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let game: Phaser.Game;

    // Dynamic import to avoid SSR issues with Phaser
    import("phaser").then((Phaser) => {
      import("@/lib/phaser/config").then(({ createPhaserConfig }) => {
        if (gameRef.current) return; // already initialized

        const config = createPhaserConfig("phaser-container", levelId);
        game = new Phaser.default.Game(config);
        gameRef.current = game;

        // Start first scene with levelId
        game.events.once("ready", () => {
          game.scene.start("PreloadScene", { levelId });
        });
      });
    });

    return () => {
      if (gameRef.current) {
        gameRef.current.destroy(true);
        gameRef.current = null;
      }
    };
  }, [levelId]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <div
        id="phaser-container"
        ref={containerRef}
        style={{
          width: "960px",
          height: "620px",
          maxWidth: "100vw",
          maxHeight: "100vh",
        }}
      />
    </div>
  );
}
