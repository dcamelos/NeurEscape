import Phaser from "phaser";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

/**
 * PreloadScene — loads level data and generates brain SVG texture.
 * Passes level config to GameScene via Phaser's scene data system.
 */
export default class PreloadScene extends Phaser.Scene {
  private levelId: string;

  constructor() {
    super({ key: "PreloadScene" });
    this.levelId = "level_01";
  }

  init(data: { levelId: string }) {
    this.levelId = data.levelId || "level_01";
  }

  preload() {
    // Loading bar
    const { width, height } = this.scale;
    const bar = this.add.graphics();
    const bg = this.add.graphics();

    bg.fillStyle(0x1e293b, 1);
    bg.fillRoundedRect(width / 2 - 200, height / 2 - 15, 400, 30, 8);

    this.load.on("progress", (value: number) => {
      bar.clear();
      bar.fillStyle(0x3b82f6, 1);
      bar.fillRoundedRect(width / 2 - 198, height / 2 - 13, 396 * value, 26, 6);
    });

    const loadingText = this.add
      .text(width / 2, height / 2 - 50, "Cargando sala de urgencias...", {
        fontSize: "16px",
        color: "#94a3b8",
        fontFamily: "monospace",
      })
      .setOrigin(0.5);
  }

  async create() {
    try {
      const res = await fetch(`${API_URL}/levels/${this.levelId}`);
      if (!res.ok) throw new Error("Level not found");
      const levelData = await res.json();
      this.scene.start("NarrativeScene", { levelData, levelId: this.levelId });
    } catch (err) {
      console.error("[PreloadScene] Failed to load level:", err);
      this.showError();
    }
  }

  private showError() {
    const { width, height } = this.scale;
    this.add
      .text(width / 2, height / 2, "Error cargando el nivel.\nVerifica que el backend esté activo.", {
        fontSize: "16px",
        color: "#ef4444",
        fontFamily: "monospace",
        align: "center",
      })
      .setOrigin(0.5);
  }
}
