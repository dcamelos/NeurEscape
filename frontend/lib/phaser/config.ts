import Phaser from "phaser";
import PreloadScene from "@/lib/phaser/scenes/PreloadScene";
import NarrativeScene from "@/lib/phaser/scenes/NarrativeScene";
import GameScene from "@/lib/phaser/scenes/GameScene";
import ResultScene from "@/lib/phaser/scenes/ResultScene";

/**
 * Returns the Phaser game configuration.
 * Kept as a factory function so it can be called client-side only.
 */
export function createPhaserConfig(
  parent: string,
  levelId: string
): Phaser.Types.Core.GameConfig {
  return {
    type: Phaser.AUTO,
    parent,
    width: 960,
    height: 620,
    backgroundColor: "#0d1117",
    scene: [PreloadScene, NarrativeScene, GameScene, ResultScene],
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    physics: { default: "arcade" },
    input: {
      dragDistanceThreshold: 4,
    },
    // Pass levelId to first scene via registry
    callbacks: {
      preBoot: (game: Phaser.Game) => {
        game.registry.set("levelId", levelId);
      },
    },
  };
}
