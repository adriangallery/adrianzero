/**
 * Pre-computed paint mask for the 148x148 T-shirt template.
 * Loaded from JSON shipped in the bundle (~3KB gzipped).
 */
import maskData from '../data/tshirt-mask.json';
import type { TShirtMask } from '../types/tshit.types';

const mask = maskData as TShirtMask;

export const CANVAS_WIDTH = mask.width;   // 148
export const CANVAS_HEIGHT = mask.height; // 148

/** Whether (x, y) is inside the painted T-shirt area. Out-of-bounds returns false. */
export function isPaintable(x: number, y: number): boolean {
  if (x < 0 || y < 0 || x >= mask.width || y >= mask.height) return false;
  const row = mask.rows[y];
  return row[x] === '1';
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
