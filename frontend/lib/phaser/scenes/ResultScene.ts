import Phaser from "phaser";
import { getSessionId } from "@/lib/analytics/sessionManager";
import { getExportUrl } from "@/lib/analytics/logger";

/**
 * ResultScene — uncertainty map + session export.
 * EDTF (Maxim, 2025): emotional arc closes here with metacognitive summary.
 * Shows what the player got right/wrong and offers JSON export for research.
 */
export default class ResultScene extends Phaser.Scene {
  private levelData: any;
  private levelId: string;
  private success: boolean;
  private timeRemaining: number;
  private hintsUsed: number;
  private placedCount: number;
  private totalSymptoms: number;

  constructor() {
    super({ key: "ResultScene" });
  }

  init(data: {
    levelData: any;
    levelId: string;
    success: boolean;
    timeRemaining: number;
    hintsUsed: number;
    placedCount: number;
  }) {
    this.levelData = data.levelData;
    this.levelId = data.levelId;
    this.success = data.success;
    this.timeRemaining = data.timeRemaining;
    this.hintsUsed = data.hintsUsed;
    this.placedCount = data.placedCount;
    this.totalSymptoms = data.levelData.symptoms.length;
  }

  create() {
    const { width, height } = this.scale;

    // Background
    const bg = this.add.graphics();
    bg.fillStyle(0x0d1117, 1);
    bg.fillRect(0, 0, width, height);

    // Scanlines
    for (let y = 0; y < height; y += 6) {
      const line = this.add.graphics();
      line.fillStyle(0x000000, 0.03);
      line.fillRect(0, y, width, 1);
    }

    const centerX = width / 2;
    const narrative = this.levelData.narrative;

    if (this.success) {
      this.drawSuccessResult(centerX, height, narrative);
    } else {
      this.drawFailureResult(centerX, height, narrative);
    }

    this.drawStats(centerX, height);
    this.drawExportButton(centerX, height);
    this.drawRetryButton(centerX, height);
  }

  private drawSuccessResult(cx: number, height: number, narrative: any) {
    // Glowing success header
    const glow = this.add.graphics();
    glow.fillStyle(0x1d9e75, 0.1);
    glow.fillRect(0, 0, cx * 2, 120);

    this.add
      .text(cx, 30, "✓ DIAGNÓSTICO CORRECTO", {
        fontSize: "14px",
        color: "#1d9e75",
        fontFamily: "monospace",
        letterSpacing: 4,
      })
      .setOrigin(0.5);

    this.add
      .text(cx, 65, this.levelData.title, {
        fontSize: "22px",
        color: "#f1f5f9",
        fontFamily: "'Segoe UI', sans-serif",
        fontStyle: "bold",
      })
      .setOrigin(0.5);

    const outroBox = this.add.graphics();
    outroBox.fillStyle(0x0f2a1a, 1);
    outroBox.lineStyle(1, 0x1d9e75, 0.5);
    outroBox.fillRoundedRect(80, 100, cx * 2 - 160, 80, 8);
    outroBox.strokeRoundedRect(80, 100, cx * 2 - 160, 80, 8);

    this.add
      .text(cx, 140, narrative.outro_success, {
        fontSize: "13px",
        color: "#94a3b8",
        fontFamily: "'Segoe UI', sans-serif",
        wordWrap: { width: cx * 2 - 200 },
        align: "center",
        lineSpacing: 5,
      })
      .setOrigin(0.5);
  }

  private drawFailureResult(cx: number, height: number, narrative: any) {
    const glow = this.add.graphics();
    glow.fillStyle(0xd9534f, 0.08);
    glow.fillRect(0, 0, cx * 2, 120);

    this.add
      .text(cx, 30, "✗ TIEMPO AGOTADO", {
        fontSize: "14px",
        color: "#d9534f",
        fontFamily: "monospace",
        letterSpacing: 4,
      })
      .setOrigin(0.5);

    this.add
      .text(cx, 65, this.levelData.title, {
        fontSize: "22px",
        color: "#f1f5f9",
        fontFamily: "'Segoe UI', sans-serif",
        fontStyle: "bold",
      })
      .setOrigin(0.5);

    const outroBox = this.add.graphics();
    outroBox.fillStyle(0x2a0f0f, 1);
    outroBox.lineStyle(1, 0xd9534f, 0.4);
    outroBox.fillRoundedRect(80, 100, cx * 2 - 160, 80, 8);
    outroBox.strokeRoundedRect(80, 100, cx * 2 - 160, 80, 8);

    this.add
      .text(cx, 140, narrative.outro_failure, {
        fontSize: "13px",
        color: "#94a3b8",
        fontFamily: "'Segoe UI', sans-serif",
        wordWrap: { width: cx * 2 - 200 },
        align: "center",
        lineSpacing: 5,
      })
      .setOrigin(0.5);
  }

  private drawStats(cx: number, height: number) {
    const statsY = 210;

    this.add
      .text(cx, statsY, "RESUMEN DE PROCESO", {
        fontSize: "10px",
        color: "#334155",
        fontFamily: "monospace",
        letterSpacing: 3,
      })
      .setOrigin(0.5);

    const divider = this.add.graphics();
    divider.lineStyle(1, 0x1e3a5f, 1);
    divider.lineBetween(80, statsY + 18, cx * 2 - 80, statsY + 18);

    const accuracy = Math.round((this.placedCount / this.totalSymptoms) * 100);
    const timeSpent = this.levelData.time_pressure_seconds - this.timeRemaining;
    const timeMin = Math.floor(timeSpent / 60);
    const timeSec = timeSpent % 60;

    const stats = [
      {
        label: "Síntomas correctos",
        value: `${this.placedCount} / ${this.totalSymptoms}`,
        color: "#1d9e75",
      },
      { label: "Precisión", value: `${accuracy}%`, color: "#3b82f6" },
      {
        label: "Tiempo empleado",
        value: `${timeMin}m ${timeSec}s`,
        color: "#f59e0b",
      },
      {
        label: "Pistas utilizadas",
        value: `${this.hintsUsed} / ${this.levelData.hints_available}`,
        color: this.hintsUsed > 0 ? "#f59e0b" : "#1d9e75",
      },
    ];

    const cardW = (cx * 2 - 160) / 4 - 12;
    stats.forEach((stat, i) => {
      const cardX = 80 + i * (cardW + 12);
      const cardY = statsY + 30;

      const card = this.add.graphics();
      card.fillStyle(0x0f172a, 1);
      card.lineStyle(1, 0x1e3a5f, 1);
      card.fillRoundedRect(cardX, cardY, cardW, 80, 6);
      card.strokeRoundedRect(cardX, cardY, cardW, 80, 6);

      this.add
        .text(cardX + cardW / 2, cardY + 20, stat.value, {
          fontSize: "22px",
          color: stat.color,
          fontFamily: "monospace",
          fontStyle: "bold",
        })
        .setOrigin(0.5);

      this.add
        .text(cardX + cardW / 2, cardY + 52, stat.label, {
          fontSize: "10px",
          color: "#475569",
          fontFamily: "monospace",
        })
        .setOrigin(0.5);
    });

    // Session ID for cross-reference
    const sessionId = getSessionId();
    this.add
      .text(cx, statsY + 125, `Sesión anónima: ${sessionId}`, {
        fontSize: "10px",
        color: "#1e3a5f",
        fontFamily: "monospace",
      })
      .setOrigin(0.5);

    // Research note
    this.add
      .text(
        cx,
        statsY + 145,
        "Los datos de proceso (tiempo, errores, secuencia) han sido registrados para investigación.",
        {
          fontSize: "10px",
          color: "#334155",
          fontFamily: "monospace",
          align: "center",
          wordWrap: { width: cx * 2 - 160 },
        }
      )
      .setOrigin(0.5);
  }

  private drawExportButton(cx: number, height: number) {
    const btnY = height - 110;

    const bg = this.add.graphics();
    bg.fillStyle(0x1a2332, 1);
    bg.lineStyle(1, 0x2d4a6e, 1);
    bg.fillRoundedRect(cx - 140, btnY - 18, 280, 36, 8);
    bg.strokeRoundedRect(cx - 140, btnY - 18, 280, 36, 8);

    const btnText = this.add
      .text(cx, btnY, "⬇ Descargar log de sesión (JSON)", {
        fontSize: "12px",
        color: "#3b82f6",
        fontFamily: "monospace",
      })
      .setOrigin(0.5);

    const hitZone = this.add
      .zone(cx, btnY, 280, 36)
      .setInteractive({ useHandCursor: true });

    hitZone.on("pointerover", () => {
      bg.clear();
      bg.fillStyle(0x1e3a5f, 1);
      bg.lineStyle(1, 0x3b82f6, 1);
      bg.fillRoundedRect(cx - 140, btnY - 18, 280, 36, 8);
      bg.strokeRoundedRect(cx - 140, btnY - 18, 280, 36, 8);
    });

    hitZone.on("pointerout", () => {
      bg.clear();
      bg.fillStyle(0x1a2332, 1);
      bg.lineStyle(1, 0x2d4a6e, 1);
      bg.fillRoundedRect(cx - 140, btnY - 18, 280, 36, 8);
      bg.strokeRoundedRect(cx - 140, btnY - 18, 280, 36, 8);
    });

    hitZone.on("pointerdown", () => {
      // Trigger browser download via anchor tag
      const exportUrl = getExportUrl();
      if (typeof window !== "undefined") {
        const a = document.createElement("a");
        a.href = exportUrl;
        a.download = `neurescape_session.json`;
        a.click();
      }
    });
  }

  private drawRetryButton(cx: number, height: number) {
    const btnY = height - 55;

    const bg = this.add.graphics();
    bg.fillStyle(0x1d4ed8, 1);
    bg.fillRoundedRect(cx - 100, btnY - 18, 200, 36, 8);

    const btnText = this.add
      .text(cx, btnY, "↩ Volver al inicio", {
        fontSize: "13px",
        color: "#ffffff",
        fontFamily: "'Segoe UI', sans-serif",
        fontStyle: "bold",
      })
      .setOrigin(0.5);

    const hitZone = this.add
      .zone(cx, btnY, 200, 36)
      .setInteractive({ useHandCursor: true });

    hitZone.on("pointerover", () => {
      bg.clear();
      bg.fillStyle(0x2563eb, 1);
      bg.fillRoundedRect(cx - 100, btnY - 18, 200, 36, 8);
    });

    hitZone.on("pointerout", () => {
      bg.clear();
      bg.fillStyle(0x1d4ed8, 1);
      bg.fillRoundedRect(cx - 100, btnY - 18, 200, 36, 8);
    });

    hitZone.on("pointerdown", () => {
      if (typeof window !== "undefined") {
        window.location.href = "/";
      }
    });
  }
}
