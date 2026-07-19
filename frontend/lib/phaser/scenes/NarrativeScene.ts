import Phaser from "phaser";
import { logEvent } from "@/lib/analytics/logger";
import { getSessionId } from "@/lib/analytics/sessionManager";

/**
 * NarrativeScene — presenta el caso clínico antes del puzzle.
 * EDTF (Maxim, 2025): El arco de tensión se intensifica con elementos visuales dinámicos.
 */
export default class NarrativeScene extends Phaser.Scene {
  private levelData: any;
  private levelId!: string;

  constructor() {
    super({ key: "NarrativeScene" });
  }

  init(data: { levelData: any; levelId: string }) {
    this.levelData = data.levelData;
    this.levelId = data.levelId;
  }

  create() {
    const { width, height } = this.scale;
    const narrative = this.levelData.narrative;

    // Log level start — stealth, Lu et al. 2025
    logEvent({
      level_id: this.levelId,
      event_type: "level_start",
      narrative_state: "intro",
    });

    // Fondo base oscuro
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x0d1117, 0x0d1117, 0x070a0e, 0x070a0e, 1);
    bg.fillRect(0, 0, width, height);

    // 1. EFECTO SCANLINE AVANZADO Y RED DE TERMINAL CLÍNICA
    const grid = this.add.grid(width / 2, height / 2, width, height, 40, 40, 0x000000, 0, 0x1e3a5f, 0.03);
    
    for (let y = 0; y < height; y += 3) {
      const line = this.add.graphics();
      line.fillStyle(0x000000, 0.05);
      line.fillRect(0, y, width, 1);
    }

    // 2. HEADER DINÁMICO CON PARPADEO DE ALERTA (Urgencias)
    const alertHeader = this.add.text(width / 2, 55, "⚕ SALA DE URGENCIAS", {
      fontSize: "12px",
      color: "#ef4444",
      fontFamily: "monospace",
      letterSpacing: 5,
    }).setOrigin(0.5);

    this.tweens.add({
      targets: alertHeader,
      alpha: { from: 0.4, to: 1 },
      duration: 800,
      yoyo: true,
      repeat: -1,
      ease: "Steps(3)" // Simula un parpadeo de pantalla CRT vieja
    });

    const mainTitle = this.add.text(width / 2, 85, this.levelData.title, {
      fontSize: "28px",
      color: "#f1f5f9",
      fontFamily: "'Segoe UI', sans-serif",
      fontStyle: "bold",
    }).setOrigin(0.5).setAlpha(0);

    // Animación de entrada suave para el título principal
    this.tweens.add({
      targets: mainTitle,
      alpha: 1,
      y: 90,
      duration: 600,
      ease: "Cubic.out"
    });

    this.add.text(width / 2, 122, this.levelData.subtitle, {
      fontSize: "13px",
      color: "#64748b",
      fontFamily: "monospace",
    }).setOrigin(0.5);

    // Divisor animado (Se expande desde el centro)
    const divider = this.add.graphics();
    divider.lineStyle(1, 0x3b82f6, 0.6);
    divider.lineBetween(width / 2, 145, width / 2, 145);
    
    this.tweens.add({
      targets: divider,
      scaleX: { from: 0, to: 1 },
      x: 0,
      duration: 800,
      ease: "Expo.out",
      onUpdate: () => {
        divider.clear();
        divider.lineStyle(1, 0x1e3a5f, 0.8);
        divider.lineBetween(80, 145, width - 80, 145);
      }
    });

    // 3. TEXTO TIPO MÁQUINA DE ESCRIBIR (Typewriter Effect)
    const narrativeBox = this.add.graphics();
    narrativeBox.fillStyle(0x0a0f1d, 0.85);
    narrativeBox.lineStyle(1, 0x1e3a5f, 0.5);
    narrativeBox.fillRoundedRect(60, 165, width - 120, 210, 8);
    narrativeBox.strokeRoundedRect(60, 165, width - 120, 210, 8);

    this.add.text(80, 180, "INFORME DE INGRESO", {
      fontSize: "10px",
      color: "#3b82f6",
      fontFamily: "monospace",
      letterSpacing: 2,
    });

    const txtContent = this.add.text(80, 205, "", {
      fontSize: "14px",
      color: "#cbd5e1",
      fontFamily: "'Segoe UI', sans-serif",
      wordWrap: { width: width - 160 },
      lineSpacing: 6,
    });

    // Lógica del Typewriter
    let currentChar = 0;
    const fullText = narrative.intro;
    
    const typewriterTimer = this.time.addEvent({
      delay: 20, // Velocidad de escritura por milisegundo
      repeat: fullText.length - 1,
      callback: () => {
        txtContent.text += fullText[currentChar];
        currentChar++;
      }
    });

    // 4. CONTENEDORES DE PISTAS ANIMADOS SECUENCIALMENTE (Staggered Fade-in)
    if (narrative.rooms && narrative.rooms.length > 0) {
      const clueY = 400;
      const clueTitle = this.add.text(width / 2, clueY, "PISTAS DISPONIBLES EN LA SALA", {
        fontSize: "10px",
        color: "#f59e0b",
        fontFamily: "monospace",
        letterSpacing: 2,
      }).setOrigin(0.5).setAlpha(0);

      // Esperar a que el texto termine un poco antes de revelar pistas
      this.time.delayedCall(1000, () => {
        this.tweens.add({ targets: clueTitle, alpha: 1, duration: 500 });
      });

      narrative.rooms.forEach((room: any, i: number) => {
        const x = 80 + (i * (width - 160)) / narrative.rooms.length;
        const roomWidth = (width - 200) / narrative.rooms.length;
        
        // Creamos un contenedor local para aplicarle animaciones grupales por sala
        const roomContainer = this.add.container(x, clueY + 20).setAlpha(0);

        const roomBox = this.add.graphics();
        roomBox.fillStyle(0x111a2e, 0.9);
        roomBox.lineStyle(1, 0x2d4a6e, 0.6);
        roomBox.fillRoundedRect(0, 0, roomWidth, 75, 6);
        roomBox.strokeRoundedRect(0, 0, roomWidth, 75, 6);

        const roomLabel = this.add.text(10, 10, `📍 ${room.label}`, {
          fontSize: "10px",
          color: "#94a3b8",
          fontFamily: "monospace",
        });

        const roomClue = this.add.text(10, 28, room.clue, {
          fontSize: "11px",
          color: "#e2e8f0",
          fontFamily: "'Segoe UI', sans-serif",
          wordWrap: { width: roomWidth - 20 },
        });

        roomContainer.add([roomBox, roomLabel, roomClue]);

        // Animación Staggered: Entran una detrás de otra en cascada
        this.time.delayedCall(1500 + i * 350, () => {
          this.tweens.add({
            targets: roomContainer,
            alpha: 1,
            y: clueY + 15,
            duration: 400,
            ease: "Back.easeOut",
          });
        });
      });
    }

    // HUD / Detalles de la sesión inferiores
    const sessionId = getSessionId();
    this.add.text(width - 20, height - 20, `sesión: ${sessionId.slice(0, 8)}...`, {
      fontSize: "10px",
      color: "#334155",
      fontFamily: "monospace",
    }).setOrigin(1, 1);

    this.add.text(20, height - 20, `⏱ ${Math.floor(this.levelData.time_pressure_seconds / 60)} min`, {
      fontSize: "12px",
      color: "#475569",
      fontFamily: "monospace",
    }).setOrigin(0, 1);

    // 5. BOTÓN DE ACCIÓN REFINADO Y PULSANTE CON SOMBRA DE GLOW
    const btnContainer = this.add.container(width / 2, height - 58);
    
    const btnBg = this.add.graphics();
    btnBg.fillStyle(0x1d4ed8, 1);
    btnBg.fillRoundedRect(-120, -22, 240, 44, 8);

    const btnText = this.add.text(0, 0, "Iniciar diagnóstico →", {
      fontSize: "15px",
      color: "#ffffff",
      fontFamily: "'Segoe UI', sans-serif",
      fontStyle: "bold",
    }).setOrigin(0.5);

    btnContainer.add([btnBg, btnText]);
    btnContainer.setAlpha(0).setY(height - 48);

    // Mostrar botón con delay estratégico
    this.time.delayedCall(2500, () => {
      this.tweens.add({
        targets: btnContainer,
        alpha: 1,
        y: height - 58,
        duration: 500,
        ease: "Cubic.out"
      });
    });

    const hitArea = this.add.zone(0, 0, 240, 44).setInteractive({ useHandCursor: true });
    btnContainer.add(hitArea);

    hitArea.on("pointerover", () => {
      btnBg.clear();
      btnBg.fillStyle(0x2563eb, 1);
      btnBg.lineStyle(1, 0x60a5fa, 1); // Borde brillante en hover
      btnBg.fillRoundedRect(-120, -22, 240, 44, 8);
      btnBg.strokeRoundedRect(-120, -22, 240, 44, 8);
      
      this.tweens.add({ targets: btnContainer, scaleX: 1.03, scaleY: 1.03, duration: 150 });
    });

    hitArea.on("pointerout", () => {
      btnBg.clear();
      btnBg.fillStyle(0x1d4ed8, 1);
      btnBg.fillRoundedRect(-120, -22, 240, 44, 8);
      
      this.tweens.add({ targets: btnContainer, scaleX: 1, scaleY: 1, duration: 150 });
    });

    hitArea.on("pointerdown", () => {
      // Pequeño flash blanco transitorio antes del cambio de escena
      this.cameras.main.flash(400, 29, 78, 216);
      this.time.delayedCall(350, () => {
        this.scene.start("GameScene", {
          levelData: this.levelData,
          levelId: this.levelId,
        });
      });
    });

    // Efecto sutil de respiración o pulso en el botón completo
    this.tweens.add({
      targets: btnContainer,
      scaleX: 0.98,
      scaleY: 0.98,
      duration: 1200,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });
  }
}
