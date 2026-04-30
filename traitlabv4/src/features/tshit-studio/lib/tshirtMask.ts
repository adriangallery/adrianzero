/**
 * Pre-computed paint mask for the 148x148 T-shirt template.
 * Loaded from JSON shipped in the bundle (~3KB gzipped).
 */
import maskData from '../data/tshirt-mask.json';
import shadingData from '../data/tshirt-shading.json';
import type { TShirtMask } from '../types/tshit.types';

const mask = maskData as TShirtMask;
// shading.rows = hex string per row, 2 chars per cell (00..ff luminance).
// Value is the rec.601 luminance of the original t-shirt fill at that cell;
// 0 for unpaintable cells. Brush + fill multiply user colors by (luminance/255)
// so the t-shirt's natural shadows survive even after painting.
const shading = shadingData as { width: number; height: number; rows: string[] };

export const CANVAS_WIDTH = mask.width;   // 148
export const CANVAS_HEIGHT = mask.height; // 148

/** Whether (x, y) is inside the painted T-shirt area. Out-of-bounds returns false. */
export function isPaintable(x: number, y: number): boolean {
  if (x < 0 || y < 0 || x >= mask.width || y >= mask.height) return false;
  const row = mask.rows[y];
  return row[x] === '1';
}

/**
 * Brightness of the original t-shirt template at (x, y), 0..1.
 * Returns 1 for unpaintable cells (caller should not call for those).
 */
export function getBrightness(x: number, y: number): number {
  if (x < 0 || y < 0 || x >= shading.width || y >= shading.height) return 1;
  const row = shading.rows[y];
  const hex = row.slice(x * 2, x * 2 + 2);
  const v = parseInt(hex, 16);
  if (!Number.isFinite(v) || v === 0) return 1;
  return v / 255;
}

/**
 * Multiply a hex color (#rrggbb) by a brightness factor (0..1).
 * Fast path: brightness >= 0.999 returns the original color unchanged.
 */
export function shadeColor(hex: string, brightness: number): string {
  if (!hex.startsWith('#') || hex.length !== 7) return hex; // unsupported format
  if (brightness >= 0.999) return hex;
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const sr = Math.max(0, Math.min(255, Math.round(r * brightness)));
  const sg = Math.max(0, Math.min(255, Math.round(g * brightness)));
  const sb = Math.max(0, Math.min(255, Math.round(b * brightness)));
  const h = (n: number) => n.toString(16).padStart(2, '0');
  return `#${h(sr)}${h(sg)}${h(sb)}`;
}

/** Returns the visible (shaded) color for a painted pixel at (x, y). */
export function shadedAt(x: number, y: number, hex: string): string {
  return shadeColor(hex, getBrightness(x, y));
}

/** Iterate every paintable cell. Useful for fill-bucket. */
export function* paintableCells(): Generator<{ x: number; y: number }> {
  for (let y = 0; y < mask.height; y++) {
    const row = mask.rows[y];
    for (let x = 0; x < mask.width; x++) {
      if (row[x] === '1') yield { x, y };
    }
  }
}

/** URL of the T-shirt SVG (background). Served from /public. */
export const TSHIRT_SVG_URL = '/tshit-tshirt.svg';
export const MANNEQUIN_SVG_URL = '/tshit-mannequin.svg';

/**
 * Bounding box of the paintable region inside the 148x148 canvas.
 * Pre-computed offline from the mask — no need to scan at runtime.
 * The t-shirt's chest/torso paint area is roughly the lower-middle quadrant;
 * stamps (text, year, stickers) anchor to this box so they land on fabric
 * rather than off-canvas above the shirt.
 */
export const PAINTABLE_BOUNDS = {
  minX: 20,
  maxX: 112,
  minY: 107,
  maxY: 147,
  width: 93,    // maxX - minX + 1
  height: 41,   // maxY - minY + 1
  centerX: 66,  // floor((minX + maxX) / 2)
  centerY: 127, // floor((minY + maxY) / 2)
} as const;
