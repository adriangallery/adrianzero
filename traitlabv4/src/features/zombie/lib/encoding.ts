/**
 * AZombie on-chain encoding (must match ZombieMintFacet byte for byte).
 *
 * Mask: 172 bytes. Pixel (x, y) → i = y*37 + x; byte = i >> 3; bit = 0x80 >> (i & 7).
 *       1 = skin pixel ERASED. Bits may only be set where the skin is opaque.
 * Traits: uint40. Slot k (0=BODY … 4=WEAPON) lives in bits [8k, 8k+8). 0 = none.
 *       Built with multiplication (not `<<`): JS bitwise ops are 32-bit and
 *       would corrupt slot 4 (bits 32..39).
 */

import { GRID, MASK_BYTES, PIXELS, SKIN_BITMAP_HEX, SLOTS, HOODED_BODIES, SLOT_BODY, SLOT_HEAD } from './zombieSpec';

export type Traits = [number, number, number, number, number];
export const NO_TRAITS: Traits = [0, 0, 0, 0, 0];

export function hexToBytes(hex: string): Uint8Array {
  const clean = hex.startsWith('0x') ? hex.slice(2) : hex;
  if (clean.length % 2 !== 0) throw new Error('odd hex length');
  const out = new Uint8Array(clean.length / 2);
  for (let i = 0; i < out.length; i++) out[i] = parseInt(clean.slice(i * 2, i * 2 + 2), 16);
  return out;
}

export function bytesToHex(bytes: Uint8Array): `0x${string}` {
  let s = '0x';
  for (const b of bytes) s += b.toString(16).padStart(2, '0');
  return s as `0x${string}`;
}

export const SKIN_BITMAP: Uint8Array = hexToBytes(SKIN_BITMAP_HEX);

export function pixelIndex(x: number, y: number): number {
  return y * GRID + x;
}

export function bytePos(i: number): { byte: number; bit: number } {
  return { byte: i >> 3, bit: 0x80 >> (i & 7) };
}

export function getBit(bytes: Uint8Array, i: number): boolean {
  return (bytes[i >> 3] & (0x80 >> (i & 7))) !== 0;
}

export function setBit(bytes: Uint8Array, i: number, on: boolean): void {
  const m = 0x80 >> (i & 7);
  if (on) bytes[i >> 3] |= m;
  else bytes[i >> 3] &= ~m & 0xff;
}

export function emptyMask(): Uint8Array {
  return new Uint8Array(MASK_BYTES);
}

export function isSkinPixel(i: number): boolean {
  return i >= 0 && i < PIXELS && getBit(SKIN_BITMAP, i);
}

/** Drop any bit that isn't on an opaque skin pixel (the contract reverts ZombieBadMask otherwise). */
export function sanitizeMask(mask: Uint8Array): Uint8Array {
  const out = new Uint8Array(MASK_BYTES);
  for (let b = 0; b < MASK_BYTES; b++) out[b] = mask[b] & SKIN_BITMAP[b];
  return out;
}

export function countErased(mask: Uint8Array): number {
  let n = 0;
  for (let i = 0; i < PIXELS; i++) if (getBit(mask, i)) n++;
  return n;
}

/**
 * Paint a square brush of `size` px (1/2/3) at (cx, cy). erase=true sets bits
 * (removes skin), erase=false clears them (restores skin). Only skin pixels.
 * Returns a NEW mask (immutable for React state).
 */
export function paintMask(mask: Uint8Array, cx: number, cy: number, size: number, erase: boolean): Uint8Array {
  const out = new Uint8Array(mask);
  const start = -Math.floor((size - 1) / 2);
  for (let dy = start; dy < start + size; dy++) {
    for (let dx = start; dx < start + size; dx++) {
      const x = cx + dx;
      const y = cy + dy;
      if (x < 0 || y < 0 || x >= GRID || y >= GRID) continue;
      const i = pixelIndex(x, y);
      if (isSkinPixel(i)) setBit(out, i, erase);
    }
  }
  return out;
}

/** Points on the segment (x0,y0)→(x1,y1) (Bresenham), so fast strokes don't leave gaps. */
export function linePoints(x0: number, y0: number, x1: number, y1: number): Array<[number, number]> {
  const pts: Array<[number, number]> = [];
  const dx = Math.abs(x1 - x0);
  const dy = -Math.abs(y1 - y0);
  const sx = x0 < x1 ? 1 : -1;
  const sy = y0 < y1 ? 1 : -1;
  let err = dx + dy;
  let x = x0;
  let y = y0;
  for (;;) {
    pts.push([x, y]);
    if (x === x1 && y === y1) break;
    const e2 = 2 * err;
    if (e2 >= dy) {
      err += dy;
      x += sx;
    }
    if (e2 <= dx) {
      err += dx;
      y += sy;
    }
  }
  return pts;
}

export function encodeTraits(traits: readonly number[]): number {
  let v = 0;
  for (let k = 0; k < 5; k++) {
    const t = traits[k] ?? 0;
    if (!Number.isInteger(t) || t < 0 || t > 255) throw new Error(`bad trait value in slot ${k}`);
    v += t * 256 ** k;
  }
  return v;
}

export function decodeTraits(v: number | bigint): Traits {
  let n = BigInt(v);
  const out: number[] = [];
  for (let k = 0; k < 5; k++) {
    out.push(Number(n & 0xffn));
    n >>= 8n;
  }
  return out as Traits;
}

export function isHooded(traits: readonly number[]): boolean {
  return HOODED_BODIES.includes(traits[SLOT_BODY]);
}

/** Apply the frontend hood rule: hooded BODY clears HEAD. */
export function normalizeTraits(traits: readonly number[]): Traits {
  const t = [...traits] as Traits;
  if (isHooded(t)) t[SLOT_HEAD] = 0;
  return t;
}

/** Random bite mask: a handful of round bites, only on skin. */
export function randomMask(rand: () => number = Math.random): Uint8Array {
  const skin: number[] = [];
  for (let i = 0; i < PIXELS; i++) if (isSkinPixel(i)) skin.push(i);
  const out = emptyMask();
  const bites = 3 + Math.floor(rand() * 5);
  for (let b = 0; b < bites; b++) {
    const c = skin[Math.floor(rand() * skin.length)];
    const cx = c % GRID;
    const cy = Math.floor(c / GRID);
    const r = 1 + rand() * 2.2;
    for (let y = Math.floor(cy - r); y <= Math.ceil(cy + r); y++) {
      for (let x = Math.floor(cx - r); x <= Math.ceil(cx + r); x++) {
        if (x < 0 || y < 0 || x >= GRID || y >= GRID) continue;
        // ragged edge: drop some border pixels so bites look chewed, not stamped
        const d = Math.hypot(x - cx, y - cy);
        if (d > r || (d > r - 1 && rand() < 0.4)) continue;
        const i = pixelIndex(x, y);
        if (isSkinPixel(i)) setBit(out, i, true);
      }
    }
  }
  return out;
}

export function randomTraits(rand: () => number = Math.random): Traits {
  const t = SLOTS.map((s) => (rand() < 0.6 ? s.options[Math.floor(rand() * s.options.length)].value : 0));
  return normalizeTraits(t);
}
