import Phaser from "phaser";
import { logEvent } from "@/lib/analytics/logger";
import { getSessionId } from "@/lib/analytics/sessionManager";

interface Symptom {
  id: string;
  label: string;
  correct_region: string;
  distractor_regions: string[];
  hints: string[];
  error_feedback: Record<string, string>;
}

interface Region {
  id: string;
  label: string;
  abbreviation: string;
  color: string;
  svg_zone: string;
  clinical_note: string;
}

interface DragCard {
  container: Phaser.GameObjects.Container;
  symptomId: string;
  startX: number;
  startY: number;
  placed: boolean;
  attemptCount: number;
  wrongTargets: string[];
  pickupTime: number;
}

/**
 * GameScene — Core drag & drop puzzle con arquitectura neuroanatómica irregular.
 * Incluye feedback predictivo en tiempo real y layout visual optimizado.
 */
export default class GameScene extends Phaser.Scene {
  private levelData: any;
  private levelId: string;

  // Estado del juego
  private symptoms: Symptom[] = [];
  private regions: Region[] = [];
  private cards: DragCard[] = [];
  private placedCount = 0;
  private totalSymptoms = 0;
  private hintsRemaining = 3;
  private timerSeconds = 600;
  private timerEvent?: Phaser.Time.TimerEvent;

  // Elementos de UI
  private timerText?: Phaser.GameObjects.Text;
  private progressText?: Phaser.GameObjects.Text;
  private feedbackContainer?: Phaser.GameObjects.Container;
  private regionZones: Map<string, Phaser.GameObjects.Graphics> = new Map();
  private regionLabels: Map<string, Phaser.GameObjects.Text> = new Map();
  private hintBtn?: Phaser.GameObjects.Container;
  private hintBtnText?: Phaser.GameObjects.Text;

  // Estado de arrastre activo y región actualmente apuntada
  private activeDragCard?: DragCard;
  private currentHoveredRegionId: string | null = null;

  // CONSTANTES DE LAYOUT RECTIFICADAS (Cerebro expandido y centrado)
  private readonly PANEL_WIDTH = 240;
  private readonly GAME_X_START = 280; 
  private readonly BRAIN_X = 260; // Desplazado a la izquierda para centrar el bloque expandido
  private readonly BRAIN_Y = 140; // Subido para dar más espacio vertical
  private readonly BRAIN_W = 700; // Ancho total del lienzo del cerebro incrementado
  private readonly BRAIN_H = 480; // Alto total del lienzo del cerebro incrementado

  constructor() {
    super({ key: "GameScene" });
  }

  init(data: { levelData: any; levelId: string }) {
    this.levelData = data.levelData;
    this.levelId = data.levelId;
    this.symptoms = data.levelData.symptoms;
    this.regions = data.levelData.regions;
    this.totalSymptoms = this.symptoms.length;
    this.hintsRemaining = data.levelData.hints_available ?? 3;
    this.timerSeconds = data.levelData.time_pressure_seconds ?? 600;
    this.placedCount = 0;
    this.cards = [];
    this.regionZones.clear();
    this.regionLabels.clear();
    this.activeDragCard = undefined;
    this.currentHoveredRegionId = null;
  }

  create() {
    const { width, height } = this.scale;
    this.drawBackground(width, height);
    this.drawHUD(width, height);
    this.drawBrainMap(width, height);
    this.drawSymptomPanel(height);
    this.drawHintButton(width, height);
    this.startTimer();
    this.enableGlobalPointerUp();
  }

  update(time: number) {
    // Respiración lumínica sutil general para las zonas que NO están bajo el cursor
    if (this.activeDragCard && !this.activeDragCard.placed) {
      const pulse = 0.12 + Math.sin(time / 140) * 0.04;
      this.regions.forEach((region) => {
        if (region.id === this.currentHoveredRegionId) return;

        const zone = this.regionZones.get(region.id);
        if (zone) {
          zone.setAlpha(pulse + 0.15);
        }
      });
    }
  }

  private drawBackground(width: number, height: number) {
    const bg = this.add.graphics();
    bg.fillStyle(0x090d16, 1);
    bg.fillRect(0, 0, width, height);

    bg.lineStyle(1, 0x1e293b, 0.15);
    const gridSize = 40;
    for (let x = 0; x < width; x += gridSize) {
      bg.lineBetween(x, 0, x, height);
    }
    for (let y = 0; y < height; y += gridSize) {
      bg.lineBetween(0, y, width, y);
    }

    const panel = this.add.graphics();
    panel.fillStyle(0x0d1527, 1);
    panel.lineStyle(1, 0x1e3a8a, 0.8);
    panel.fillRect(0, 0, this.PANEL_WIDTH, height);
    panel.lineBetween(this.PANEL_WIDTH, 0, this.PANEL_WIDTH, height);
  }

  private drawHUD(width: number, height: number) {
    const topBar = this.add.graphics();
    topBar.fillStyle(0x070b14, 0.9);
    topBar.fillRect(this.PANEL_WIDTH, 0, width - this.PANEL_WIDTH, 55);
    topBar.lineStyle(1, 0x1e3a8a, 0.6);
    topBar.lineBetween(this.PANEL_WIDTH, 55, width, 55);

    this.add.text(this.GAME_X_START, 27, "⚕ MONITOR CLÍNICO", {
      fontSize: "11px",
      color: "#38bdf8",
      fontFamily: "monospace",
      fontStyle: "bold",
      letterSpacing: 3,
    }).setOrigin(0, 0.5);

    this.add
      .text(this.GAME_X_START + 155, 27, `// Caso: ${this.levelData.title}`, {
        fontSize: "12px",
        color: "#64748b",
        fontFamily: "monospace",
      })
      .setOrigin(0, 0.5);

    this.timerText = this.add
      .text(width - 45, 27, this.formatTime(this.timerSeconds), {
        fontSize: "18px",
        color: "#4ade80",
        fontFamily: "monospace",
        fontStyle: "bold",
      })
      .setOrigin(1, 0.5);

    this.progressText = this.add
      .text(this.GAME_X_START, height - 25, `PACIENTE PROGRESO: ${this.placedCount} / ${this.totalSymptoms} SÍNTOMAS ASIGNADOS`, {
        fontSize: "11px",
        color: "#475569",
        fontFamily: "monospace",
        letterSpacing: 1
      })
      .setOrigin(0, 1);

    const sessionId = getSessionId();
    this.add
      .text(width - 15, height - 15, `SESS_NODE://_${sessionId.slice(0, 8).toUpperCase()}`, {
        fontSize: "9px",
        color: "#1e3a5f",
        fontFamily: "monospace",
      })
      .setOrigin(1, 1);
  }

  private drawSymptomPanel(height: number) {
    const paddingX = 16; 

    this.add
      .text(paddingX, 22, "⚕️ SÍNTOMAS REPORTADOS", {
        fontSize: "11px",
        color: "#38bdf8",
        fontFamily: "monospace",
        fontStyle: "bold",
        letterSpacing: 2,
      })
      .setOrigin(0, 0.5);

    this.add
      .text(paddingX, 38, "// Clasifique los nodos sintomáticos", {
        fontSize: "9px",
        color: "#475569",
        fontFamily: "monospace",
      })
      .setOrigin(0, 0.5);

    const startY = 68; 
    const cardH = 48;    
    const cardGap = 10;   
    const cardW = this.PANEL_WIDTH - (paddingX * 2); 

    this.symptoms.forEach((symptom, i) => {
      const cardY = startY + i * (cardH + cardGap);
      this.createDraggableCard(symptom, paddingX + cardW / 2, cardY + cardH / 2, cardW, cardH);
    });
  }

  private createDraggableCard(symptom: Symptom, x: number, y: number, w: number, h: number) {
    const bg = this.add.graphics();
    
    bg.fillStyle(0x0b1324, 0.85);
    bg.lineStyle(1, 0x1e293b, 1);
    bg.fillRoundedRect(-w / 2, -h / 2, w, h, 4);
    bg.strokeRoundedRect(-w / 2, -h / 2, w, h, 4);

    bg.fillStyle(0x38bdf8, 0.4);
    bg.fillRect(-w / 2 + 1, -h / 2 + 3, 3, h - 6);

    const iconX = -w / 2 + 12;
    const icon = this.add.text(iconX, 0, "⬡", {
      fontSize: "10px",
      color: "#38bdf8"
    }).setOrigin(0, 0.5);

    const textX = iconX + 16;
    const label = this.add.text(textX, 0, symptom.label.toUpperCase(), {
      fontSize: "9.5px",
      color: "#cbd5e1",
      fontFamily: "monospace",
      fontStyle: "bold",
      wordWrap: { width: w - 38, useAdvancedWrap: true },
    }).setOrigin(0, 0.5);

    const container = this.add.container(x, y, [bg, icon, label]);
    container.setSize(w, h);
    
    container.setInteractive({
      hitArea: new Phaser.Geom.Rectangle(-w / 2, -h / 2, w, h),
      hitAreaCallback: Phaser.Geom.Rectangle.Contains,
      draggable: true,
      useHandCursor: true
    });

    const card: DragCard = {
      container,
      symptomId: symptom.id,
      startX: x,
      startY: y,
      placed: false,
      attemptCount: 0,
      wrongTargets: [],
      pickupTime: 0,
    };
    this.cards.push(card);

    let dragOffsetX = 0;
    let dragOffsetY = 0;

    container.on("dragstart", (pointer: Phaser.Input.Pointer) => {
      if (card.placed) return;
      card.pickupTime = Date.now();
      this.activeDragCard = card;
      this.currentHoveredRegionId = null;

      dragOffsetX = container.x - pointer.worldX;
      dragOffsetY = container.y - pointer.worldY;

      this.children.bringToTop(container);

      bg.clear();
      bg.fillStyle(0x0f2447, 0.95);
      bg.lineStyle(1.5, 0x00f5ff, 1);
      bg.fillRoundedRect(-w / 2, -h / 2, w, h, 4);
      bg.strokeRoundedRect(-w / 2, -h / 2, w, h, 4);
      
      bg.fillStyle(0x00f5ff, 1);
      bg.fillRect(-w / 2 + 1, -h / 2 + 3, 3, h - 6);

      icon.setText("⬢").setColor("#00f5ff");
      label.setColor("#ffffff");

      this.tweens.add({
        targets: container,
        scaleX: 1.03,
        scaleY: 1.03,
        duration: 80,
        ease: "Sine.easeOut"
      });

      this.highlightZones(true);
    });

    container.on("drag", (pointer: Phaser.Input.Pointer) => {
      if (card.placed) return;
      container.x = pointer.worldX + dragOffsetX;
      container.y = pointer.worldY + dragOffsetY;

      const currentTargetRegion = this.getRegionAtPoint(pointer.worldX, pointer.worldY);
      if (currentTargetRegion !== this.currentHoveredRegionId) {
        if (this.currentHoveredRegionId) {
          this.resetRegionVisual(this.currentHoveredRegionId, true);
        }
        this.currentHoveredRegionId = currentTargetRegion;
        if (this.currentHoveredRegionId) {
          this.highlightRegionAsTarget(this.currentHoveredRegionId);
        }
      }
    });

    container.on("dragend", () => {
      if (card.placed) return;
      
      bg.clear();
      bg.fillStyle(0x0b1324, 0.85);
      bg.lineStyle(1, 0x1e293b, 1);
      bg.fillRoundedRect(-w / 2, -h / 2, w, h, 4);
      bg.strokeRoundedRect(-w / 2, -h / 2, w, h, 4);
      bg.fillStyle(0x38bdf8, 0.4);
      bg.fillRect(-w / 2 + 1, -h / 2 + 3, 3, h - 6);

      icon.setText("⬡").setColor("#38bdf8");
      label.setColor("#cbd5e1");

      this.tweens.add({
        targets: container,
        scaleX: 1,
        scaleY: 1,
        duration: 100,
        ease: "Sine.easeIn"
      });

      this.highlightZones(false);
      this.handleDrop(card, container.x, container.y);
      this.currentHoveredRegionId = null;
    });
  }

  // ─────────────────────────────────────────────────────────────────────────
  // MAPA CEREBRAL (SILUETA CURVA AGRANDADA Y CENTRADA BIEN)
  // ─────────────────────────────────────────────────────────────────────────

  private drawBrainMap(width: number, height: number) {
    // cx, cy recalculados basados en el nuevo bounding box del contenedor expandido
    const cx = this.BRAIN_X + this.BRAIN_W / 2;
    const cy = this.BRAIN_Y + this.BRAIN_H / 2 - 10;

    const brainGraphics = this.add.graphics();
    brainGraphics.fillStyle(0x0f172a, 1);
    brainGraphics.lineStyle(2, 0x2563eb, 0.6);

    // Se escaló el Path original un ~35% más grande para llenar el viewport del juego
    const path = new Phaser.Curves.Path(cx - 245, cy + 25);
    path.quadraticBezierTo(cx - 80, cy - 175, cx - 230, cy - 160);
    path.quadraticBezierTo(cx + 190, cy - 80, cx + 80, cy - 190);
    path.quadraticBezierTo(cx + 175, cy + 120, cx + 255, cy + 15);
    path.quadraticBezierTo(cx - 55, cy + 95, cx + 55, cy + 150);
    path.quadraticBezierTo(cx - 190, cy + 40, cx - 160, cy + 110);
    path.closePath();

    path.draw(brainGraphics);
    
    brainGraphics.beginPath();
    path.getPoints().forEach((point, index) => {
      if (index === 0) {
        brainGraphics.moveTo(point.x, point.y);
      } else {
        brainGraphics.lineTo(point.x, point.y);
      }
    });
    brainGraphics.closePath();
    brainGraphics.fillPath();
    brainGraphics.strokePath();

    // Cerebelo redimensionado de manera proporcional
    const cb = this.add.graphics();
    cb.fillStyle(0x131e35, 1);
    cb.lineStyle(1.5, 0x475569, 0.5);
    cb.fillEllipse(cx + 135, cy + 150, 150, 80);
    cb.strokeEllipse(cx + 135, cy + 150, 150, 80);
    
    this.add.text(cx + 135, cy + 150, "CEREBELO", {
      fontSize: "10px",
      color: "#475569",
      fontFamily: "monospace",
      fontStyle: "bold",
      letterSpacing: 1
    }).setOrigin(0.5);

    this.add
      .text(cx, cy - 230, "MAPA DE CORRELACIÓN CORTICAL", {
        fontSize: "12px",
        color: "#334155",
        fontFamily: "monospace",
        fontStyle: "bold",
        letterSpacing: 2,
      })
      .setOrigin(0.5);

    this.regions.forEach((region) => {
      this.drawRegionZone(region, cx, cy);
    });
  }

  private getRegionPolygon(svgZone: string, cx: number, cy: number) {
    let points: number[] = [];
    let labelX = cx;
    let labelY = cy;

    // Polígonos adaptados a las nuevas dimensiones masivas del mapa cortical
    switch (svgZone) {
      case "frontal":
        points = [
          cx - 15,  cy - 80,   
          cx - 80,  cy - 175,  
          cx - 165, cy - 135,  
          cx - 245, cy + 25,   
          cx - 190, cy + 40,   
          cx - 135, cy + 20,   
          cx - 15,  cy + 15,   
        ];
        labelX = cx - 140;
        labelY = cy - 55;
        break;

      case "parietal":
        points = [
          cx - 80,  cy - 175,  
          cx + 80,  cy - 190,  
          cx + 190, cy - 80,   
          cx + 135, cy - 15,   
          cx - 15,  cy - 15,   
          cx - 15,  cy - 80    
        ];
        labelX = cx + 50;
        labelY = cy - 100;
        break;

      case "occipital":
        points = [
          cx + 190, cy - 80,   
          cx + 255, cy + 15,   
          cx + 175, cy + 120,   
          cx + 110,  cy + 80,   
          cx + 135, cy - 15    
        ];
        labelX = cx + 185;
        labelY = cy + 15;
        break;

      case "temporal":
        points = [
          cx - 135, cy + 20,   
          cx - 15,  cy + 15,   
          cx + 110,  cy + 25,   
          cx + 80,  cy + 105,   
          cx - 55,  cy + 95,   
          cx - 160, cy + 110    
        ];
        labelX = cx - 50;
        labelY = cy + 60;
        break;

      case "temporal_medial":
        points = [
          cx - 40,  cy - 30,
          cx + 70,  cy - 30,
          cx + 95,  cy + 25,
          cx + 40,  cy + 70,
          cx - 40,  cy + 55
        ];
        labelX = cx + 20;
        labelY = cy + 15;
        break;

      default:
        points = [cx - 70, cy - 70, cx + 70, cy - 70, cx + 70, cy + 70, cx - 70, cy + 70];
        labelX = cx;
        labelY = cy;
    }

    return { poly: new Phaser.Geom.Polygon(points), labelX, labelY };
  }

  private drawRegionZone(region: Region, cx: number, cy: number) {
    const { poly, labelX, labelY } = this.getRegionPolygon(region.svg_zone, cx, cy);
    const color = parseInt(region.color.replace("#", ""), 16);

    const zone = this.add.graphics();
    zone.fillStyle(color, 0.08);
    zone.lineStyle(1.5, color, 0.4);
    zone.fillPoints(poly.points, true);
    zone.strokePoints(poly.points, true);
    
    this.regionZones.set(region.id, zone);

    const label = this.add
      .text(labelX, labelY - 6, region.abbreviation.toUpperCase(), {
        fontSize: "13px",
        color: region.color,
        fontFamily: "monospace",
        fontStyle: "bold",
      })
      .setOrigin(0.5);
    this.regionLabels.set(region.id, label);

    this.add
      .text(labelX, labelY + 14, region.label, {
        fontSize: "9.5px",
        color: "#64748b",
        fontFamily: "monospace",
        wordWrap: { width: 110 },
        align: "center",
      })
      .setOrigin(0.5);
  }

  private highlightRegionAsTarget(regionId: string) {
    const zone = this.regionZones.get(regionId);
    if (!zone) return;
    const region = this.regions.find((r) => r.id === regionId)!;
    const cx = this.BRAIN_X + this.BRAIN_W / 2;
    const cy = this.BRAIN_Y + this.BRAIN_H / 2 - 10;
    const { poly } = this.getRegionPolygon(region.svg_zone, cx, cy);
    const color = parseInt(region.color.replace("#", ""), 16);

    zone.setAlpha(1); 
    zone.clear();
    zone.fillStyle(color, 0.35); 
    zone.lineStyle(3, color, 1);   
    zone.fillPoints(poly.points, true);
    zone.strokePoints(poly.points, true);
  }

  private resetRegionVisual(regionId: string, isDraggingModeActive: boolean) {
    const zone = this.regionZones.get(regionId);
    if (!zone) return;
    const region = this.regions.find((r) => r.id === regionId)!;
    const cx = this.BRAIN_X + this.BRAIN_W / 2;
    const cy = this.BRAIN_Y + this.BRAIN_H / 2 - 10;
    const { poly } = this.getRegionPolygon(region.svg_zone, cx, cy);
    const color = parseInt(region.color.replace("#", ""), 16);

    zone.clear();
    if (isDraggingModeActive) {
      zone.fillStyle(color, 0.22);
      zone.lineStyle(2, color, 0.9);
    } else {
      zone.setAlpha(1);
      zone.fillStyle(color, 0.08);
      zone.lineStyle(1.5, color, 0.4);
    }
    zone.fillPoints(poly.points, true);
    zone.strokePoints(poly.points, true);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // SISTEMA DE PISTAS (ÁREA DE INTERACCIÓN OPTIMIZADA POR RECTÁNGULO)
  // ─────────────────────────────────────────────────────────────────────────

  private drawHintButton(width: number, height: number) {
    const btnX = width - 65;
    const btnY = height - 75; 

    const bg = this.add.graphics();
    bg.fillStyle(0x0b1324, 0.85);
    bg.lineStyle(1.5, 0x22d3ee, 0.5);
    bg.fillCircle(0, -10, 24);
    bg.strokeCircle(0, -10, 24);

    const icon = this.add.text(0, -10, "💡", {
      fontSize: "18px",
    }).setOrigin(0.5);

    this.hintBtnText = this.add.text(0, 24, `PISTAS (${this.hintsRemaining})`, {
      fontSize: "9px",
      color: "#38bdf8",
      fontFamily: "monospace",
      fontStyle: "bold",
      letterSpacing: 1
    }).setOrigin(0.5);

    this.hintBtn = this.add.container(btnX, btnY, [bg, icon, this.hintBtnText]);
    
    const hitW = 60;
    const hitH = 70;
    this.hintBtn.setSize(hitW, hitH);
    
    // hitArea rectangular perfecto que envuelve de forma nativa todo el widget flotante
    this.hintBtn.setInteractive({
      hitArea: new Phaser.Geom.Rectangle(-hitW / 2, -hitH / 2 - 5, hitW, hitH),
      hitAreaCallback: Phaser.Geom.Rectangle.Contains,
      useHandCursor: true
    });

    this.hintBtn.on("pointerdown", () => {
      if (this.hintsRemaining <= 0) return;
      this.useHint();

      bg.clear();
      bg.fillStyle(0x22d3ee, 0.3);
      bg.lineStyle(2, 0x00f5ff, 1);
      bg.fillCircle(0, -10, 24);
      bg.strokeCircle(0, -10, 24);
    });

    this.hintBtn.on("pointerover", () => {
      bg.clear();
      bg.fillStyle(0x0e2447, 0.9);
      bg.lineStyle(2, 0x00f5ff, 1);
      bg.fillCircle(0, -10, 24);
      bg.strokeCircle(0, -10, 24);
      this.hintBtnText?.setColor("#00f5ff");
    });

    this.hintBtn.on("pointerout", () => {
      bg.clear();
      bg.fillStyle(0x0b1324, 0.85);
      bg.lineStyle(1.5, 0x22d3ee, 0.5);
      bg.fillCircle(0, -10, 24);
      bg.strokeCircle(0, -10, 24);
      this.hintBtnText?.setColor("#38bdf8");
    });
  }

  // ─────────────────────────────────────────────────────────────────────────
  // FEEDBACK CLÍNICO
  // ─────────────────────────────────────────────────────────────────────────

  private showFeedback(msg: string, color: string, _icon: any, isError = false, duration = 3200) {
    const { width, height } = this.scale;

    if (this.feedbackContainer) {
      this.feedbackContainer.destroy();
    }

    const bg = this.add.graphics();
    const bgColor = isError ? 0x240f13 : 0x092414;
    const borderColor = isError ? 0xf43f5e : 0x10b981;

    const feedbackW = width - this.PANEL_WIDTH - 60;
    const feedbackH = 50;

    bg.fillStyle(bgColor, 0.95);
    bg.lineStyle(1, borderColor, 0.8);
    bg.fillRoundedRect(0, 0, feedbackW, feedbackH, 4);
    bg.strokeRoundedRect(0, 0, feedbackW, feedbackH, 4);

    const text = this.add.text(14, 10, msg, {
      fontSize: "11px",
      color: color,
      fontFamily: "monospace",
      wordWrap: { width: feedbackW - 28 },
      lineSpacing: 2,
    });

    this.feedbackContainer = this.add.container(this.PANEL_WIDTH + 30, height - 85, [bg, text]);
    this.feedbackContainer.setAlpha(0);

    this.tweens.add({
      targets: this.feedbackContainer,
      alpha: 1,
      duration: 150,
    });

    this.time.delayedCall(duration, () => {
      if (this.feedbackContainer) {
        this.tweens.add({
          targets: this.feedbackContainer,
          alpha: 0,
          duration: 250,
          onComplete: () => this.feedbackContainer?.destroy(),
        });
      }
    });
  }

  // ─────────────────────────────────────────────────────────────────────────
  // LOGIC & DETECTION ENGINE
  // ─────────────────────────────────────────────────────────────────────────

  private handleDrop(card: DragCard, dropX: number, dropY: number) {
    const symptom = this.symptoms.find((s) => s.id === card.symptomId)!;
    const hitRegion = this.getRegionAtPoint(dropX, dropY);

    if (!hitRegion) {
      this.returnCard(card);
      return;
    }

    const timeOnCard = Date.now() - card.pickupTime;
    const isCorrect = hitRegion === symptom.correct_region;
    card.attemptCount++;

    logEvent({
      level_id: this.levelId,
      event_type: "drag_drop_attempt",
      narrative_state: "game",
      symptom_id: symptom.id,
      target_region: hitRegion,
      correct_region: symptom.correct_region,
      is_correct: isCorrect,
      attempt_number: card.attemptCount,
      time_on_card_ms: timeOnCard,
      previous_wrong_targets: [...card.wrongTargets],
      hints_used: this.levelData.hints_available - this.hintsRemaining,
    });

    if (isCorrect) {
      this.onCorrectDrop(card, hitRegion);
    } else {
      card.wrongTargets.push(hitRegion);
      this.onWrongDrop(card, hitRegion, symptom);
    }
  }

  private getRegionAtPoint(x: number, y: number): string | null {
    const cx = this.BRAIN_X + this.BRAIN_W / 2;
    const cy = this.BRAIN_Y + this.BRAIN_H / 2 - 10;

    for (const region of this.regions) {
      const { poly } = this.getRegionPolygon(region.svg_zone, cx, cy);
      if (Phaser.Geom.Polygon.Contains(poly, x, y)) {
        return region.id;
      }
    }
    return null;
  }

  private onCorrectDrop(card: DragCard, regionId: string) {
    card.placed = true;
    this.placedCount++;

    const cx = this.BRAIN_X + this.BRAIN_W / 2;
    const cy = this.BRAIN_Y + this.BRAIN_H / 2 - 10;
    const region = this.regions.find((r) => r.id === regionId)!;
    const { labelX, labelY } = this.getRegionPolygon(region.svg_zone, cx, cy);

    this.tweens.add({
      targets: card.container,
      x: labelX,
      y: labelY,
      scaleX: 0.55,
      scaleY: 0.55,
      alpha: 0.4,
      duration: 250,
      ease: "Back.easeOut",
    });

    this.flashRegion(regionId, 0x10b981, true);
    this.showFeedback("✓ VÍNCULO NEUROLÓGICO CORRECTO: El síntoma mapea con el lóbulo indicado.", "#10b981", null);
    this.progressText?.setText(`PACIENTE PROGRESO: ${this.placedCount} / ${this.totalSymptoms} SÍNTOMAS ASIGNADOS`);

    if (this.placedCount >= this.totalSymptoms) {
      this.time.delayedCall(800, () => this.triggerLevelComplete());
    }
  }

  private onWrongDrop(card: DragCard, regionId: string, symptom: Symptom) {
    this.flashRegion(regionId, 0xf43f5e, false);
    this.returnCard(card);

    const errorMsg =
      symptom.error_feedback[regionId] ||
      "Incoherencia anatómica detectada. Compruebe los marcadores clínicos.";
    this.showFeedback(`✗ ALERTA: ${errorMsg}`, "#f43f5e", null, true);

    if (card.attemptCount >= 3 && this.hintsRemaining > 0) {
      this.time.delayedCall(2500, () => {
        this.showAutoHint(symptom, card.attemptCount);
      });
    }
  }

  private returnCard(card: DragCard) {
    this.tweens.add({
      targets: card.container,
      x: card.startX,
      y: card.startY,
      scaleX: 1,
      scaleY: 1,
      duration: 350,
      ease: "Back.easeOut",
    });
  }

  private useHint() {
    if (this.hintsRemaining <= 0) return;

    const unplacedCard = this.cards.find((c) => !c.placed);
    if (!unplacedCard) return;

    const symptom = this.symptoms.find((s) => s.id === unplacedCard.symptomId)!;
    const hintLevel = Math.min(3 - this.hintsRemaining + 1, symptom.hints.length);
    const hintText = symptom.hints[hintLevel - 1] || symptom.hints[symptom.hints.length - 1];

    this.hintsRemaining--;
    this.hintBtnText?.setText(`PISTAS (${this.hintsRemaining})`);

    logEvent({
      level_id: this.levelId,
      event_type: "hint_request",
      narrative_state: "game",
      symptom_id: symptom.id,
      hints_used: this.levelData.hints_available - this.hintsRemaining,
      hint_level: hintLevel,
    });

    this.showFeedback(`💡 DESCRIPCIÓN DIAGNÓSTICA (Nivel ${hintLevel}): ${hintText}`, "#22d3ee", null, false, 5500);
  }

  private showAutoHint(symptom: Symptom, attemptCount: number) {
    if (this.hintsRemaining <= 0) return;
    const hintIdx = Math.min(attemptCount - 3, symptom.hints.length - 1);
    const hintText = symptom.hints[hintIdx] || symptom.hints[0];
    
    this.hintsRemaining--;
    this.hintBtnText?.setText(`PISTAS (${this.hintsRemaining})`);

    logEvent({
      level_id: this.levelId,
      event_type: "hint_request",
      narrative_state: "game_auto",
      symptom_id: symptom.id,
      hints_used: this.levelData.hints_available - this.hintsRemaining,
      hint_level: hintIdx + 1,
    });

    this.showFeedback(`💡 PISTA AUTOMÁTICA DE SOPORTE: ${hintText}`, "#eab308", null, false, 5500);
  }

  private flashRegion(regionId: string, color: number, success: boolean) {
    const zone = this.regionZones.get(regionId);
    if (!zone) return;

    const region = this.regions.find((r) => r.id === regionId)!;
    const cx = this.BRAIN_X + this.BRAIN_W / 2;
    const cy = this.BRAIN_Y + this.BRAIN_H / 2 - 10;
    const { poly, labelX, labelY } = this.getRegionPolygon(region.svg_zone, cx, cy);

    zone.clear();
    zone.fillStyle(color, 0.35);
    zone.lineStyle(3, color, 1);
    zone.fillPoints(poly.points, true);
    zone.strokePoints(poly.points, true);

    if (success) {
      const check = this.add
        .text(labelX, labelY - 30, "✓", {
          fontSize: "30px",
          color: "#ffffff",
          fontFamily: "monospace",
          fontStyle: "bold"
        })
        .setOrigin(0.5);

      this.tweens.add({
        targets: check,
        scaleX: 1.4,
        scaleY: 1.4,
        alpha: 0,
        duration: 500,
        onComplete: () => check.destroy(),
      });
    } else {
      this.tweens.add({
        targets: zone,
        x: "+=5",
        duration: 45,
        yoyo: true,
        repeat: 2,
        onComplete: () => {
          this.resetRegionVisual(regionId, false);
          zone.x = 0;
        },
      });
    }
  }

  private highlightZones(active: boolean) {
    this.regions.forEach((region) => {
      this.resetRegionVisual(region.id, active);
    });
    
    if (!active) {
      this.activeDragCard = undefined;
    }
  }

  private startTimer() {
    this.timerEvent = this.time.addEvent({
      delay: 1000,
      callback: this.onTimerTick,
      callbackScope: this,
      loop: true,
    });
  }

  private onTimerTick() {
    this.timerSeconds--;
    const formatted = this.formatTime(this.timerSeconds);
    this.timerText?.setText(formatted);

    if (this.timerSeconds <= 60) {
      this.timerText?.setColor("#f43f5e");
      this.timerText?.setAlpha(this.timerSeconds % 2 === 0 ? 0.4 : 1);
    } else if (this.timerSeconds <= 180) {
      this.timerText?.setColor("#fbbf24");
    }

    if (this.timerSeconds <= 0) {
      this.timerEvent?.destroy();
      this.triggerTimeOut();
    }
  }

  private formatTime(seconds: number): string {
    const m = Math.floor(seconds / 60).toString().padStart(2, "0");
    const s = (seconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  }

  private triggerLevelComplete() {
    this.timerEvent?.destroy();

    logEvent({
      level_id: this.levelId,
      event_type: "level_complete",
      narrative_state: "complete",
      hints_used: this.levelData.hints_available - this.hintsRemaining,
    });

    this.scene.start("ResultScene", {
      levelData: this.levelData,
      levelId: this.levelId,
      success: true,
      timeRemaining: this.timerSeconds,
      hintsUsed: this.levelData.hints_available - this.hintsRemaining,
      placedCount: this.placedCount,
    });
  }

  private triggerTimeOut() {
    logEvent({
      level_id: this.levelId,
      event_type: "level_complete",
      narrative_state: "timeout",
      hints_used: this.levelData.hints_available - this.hintsRemaining,
      is_correct: false,
    });

    this.scene.start("ResultScene", {
      levelData: this.levelData,
      levelId: this.levelId,
      success: false,
      timeRemaining: 0,
      hintsUsed: this.levelData.hints_available - this.hintsRemaining,
      placedCount: this.placedCount,
    });
  }

  private enableGlobalPointerUp() {
    this.input.on("pointerup", () => {
      this.highlightZones(false);
    });
  }
}
