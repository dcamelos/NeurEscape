 * BrainMap — Interactive SVG brain with 5 clickable/droppable regions.
 * Rendered as a Phaser GameObject using SVG zones mapped to polygon hit areas.
 * Each region corresponds to clinical neuroanatomy (Sandrone & Carlson, 2021).
 */

export interface BrainRegion {
  id: string;
  label: string;
  abbreviation: string;
  color: string;
  svg_zone: string;
  clinical_note: string;
}

export interface RegionHitZone {
  regionId: string;
  x: number;
  y: number;
  width: number;
  height: number;
  color: number;
  label: string;
}

/**
 * Maps level region IDs to Phaser canvas coordinates.
 * Zones are proportional to an 800x500 canvas.
 * Based on a simplified lateral view of the left hemisphere.
 */
export function getRegionHitZones(regions: BrainRegion[]): RegionHitZone[] {
  // Posiciones estimadas de los centros de las 5 regiones sobre el lienzo de Phaser
  const zoneMap: Record<string, { x: number; y: number; w: number; h: number }> = {
    frontal:         { x: 120, y: 140, w: 180, h: 160 },
    temporal_medial: { x: 180, y: 300, w: 130, h: 100 },
    temporal:        { x: 160, y: 260, w: 160, h: 120 },
    parietal:        { x: 310, y: 100, w: 180, h: 160 },
    occipital:       { x: 490, y: 140, w: 140, h: 160 },
  };

  return regions.map((region) => {
    const zone = zoneMap[region.svg_zone] || { x: 300, y: 200, w: 120, h: 80 };
    const colorHex = parseInt(region.color.replace("#", ""), 16);
    return {
      regionId: region.id,
      x: zone.x,
      y: zone.y,
      width: zone.w,
      height: zone.h,
      color: colorHex,
      label: region.label,
    };
  });
}

/**
 * Converts a hex color string to Phaser-compatible number.
 */
export function hexToPhaser(hex: string): number {
  return parseInt(hex.replace("#", "0x"), 16);
}
