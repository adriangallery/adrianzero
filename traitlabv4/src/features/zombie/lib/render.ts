/**
 * AZombie renderer — composes the 37×37 layers on a canvas, in spec order:
 * skeleton → skin (masked; skipped for variant 1) → BODY → MOUTH → EYES → HEAD → WEAPON.
 */

import { GRID, LAYER_BASE, ALL_LAYER_FILES, SLOTS, VARIANT_ZOMBIE0, optionFor } from './zombieSpec';
import { getBit } from './encoding';

export interface BBox {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface LayerSet {
  imgs: Record<string, HTMLImageElement>;
  bbox: Record<string, BBox>;
  skin: ImageData;
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.decoding = 'async';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`layer failed: ${src}`));
    img.src = src;
  });
}

function makeCanvas(): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = GRID;
  c.height = GRID;
  return c;
}

let cached: Promise<LayerSet> | null = null;

export function loadLayers(): Promise<LayerSet> {
  cached ??= (async () => {
    const entries = await Promise.all(
      ALL_LAYER_FILES.map(async (f) => [f, await loadImage(`${LAYER_BASE}/${f}`)] as const)
    );
    const imgs = Object.fromEntries(entries) as Record<string, HTMLImageElement>;
    const scratch = makeCanvas();
    const ctx = scratch.getContext('2d', { willReadFrequently: true })!;
    const bbox: Record<string, BBox> = {};
    let skin: ImageData | null = null;
    for (const [f, img] of entries) {
      ctx.clearRect(0, 0, GRID, GRID);
      ctx.drawImage(img, 0, 0);
      const data = ctx.getImageData(0, 0, GRID, GRID);
      if (f === 'skin.png') skin = data;
      let x0 = GRID, y0 = GRID, x1 = -1, y1 = -1;
      for (let y = 0; y < GRID; y++) {
        for (let x = 0; x < GRID; x++) {
          if (data.data[(y * GRID + x) * 4 + 3] > 0) {
            if (x < x0) x0 = x;
            if (y < y0) y0 = y;
            if (x > x1) x1 = x;
            if (y > y1) y1 = y;
          }
        }
      }
      bbox[f] = x1 < 0 ? { x: 0, y: 0, w: GRID, h: GRID } : { x: x0, y: y0, w: x1 - x0 + 1, h: y1 - y0 + 1 };
    }
    return { imgs, bbox, skin: skin! };
  })();
  cached.catch(() => {
    cached = null; // allow a retry on the next mount
  });
  return cached;
}

let skinCanvas: HTMLCanvasElement | null = null;

export function drawZombie(
  ctx: CanvasRenderingContext2D,
  layers: LayerSet,
  mask: Uint8Array,
  traits: readonly number[],
  variant: number
): void {
  ctx.imageSmoothingEnabled = false;
  ctx.clearRect(0, 0, GRID, GRID);
  ctx.drawImage(layers.imgs['skeleton.png'], 0, 0);

  if (variant !== VARIANT_ZOMBIE0) {
    skinCanvas ??= makeCanvas();
    const sctx = skinCanvas.getContext('2d')!;
    const data = new ImageData(new Uint8ClampedArray(layers.skin.data), GRID, GRID);
    for (let i = 0; i < GRID * GRID; i++) if (getBit(mask, i)) data.data[i * 4 + 3] = 0;
    sctx.putImageData(data, 0, 0);
    ctx.drawImage(skinCanvas, 0, 0);
  }

  for (const s of SLOTS) {
    const opt = optionFor(s.slot, traits[s.slot] ?? 0);
    if (opt) ctx.drawImage(layers.imgs[opt.file], 0, 0);
  }
}
