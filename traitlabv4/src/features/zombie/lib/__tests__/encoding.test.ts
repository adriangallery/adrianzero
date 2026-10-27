import { describe, it, expect } from 'vitest';
import {
  SKIN_BITMAP,
  bytesToHex,
  bytePos,
  countErased,
  decodeTraits,
  emptyMask,
  encodeTraits,
  getBit,
  isSkinPixel,
  normalizeTraits,
  paintMask,
  pixelIndex,
  randomMask,
  sanitizeMask,
  setBit,
} from '../encoding';
import { GRID, MASK_BYTES, PIXELS } from '../zombieSpec';

describe('AZombie mask encoding', () => {
  it('empty mask is 172 zero bytes', () => {
    const m = emptyMask();
    expect(m.length).toBe(172);
    expect(MASK_BYTES).toBe(Math.ceil(PIXELS / 8));
    expect(bytesToHex(m)).toBe(`0x${'00'.repeat(172)}`);
  });

  it('skin bitmap is 172 bytes and has no bits past pixel 1368', () => {
    expect(SKIN_BITMAP.length).toBe(172);
    // 1369 = 171*8 + 1 → only the MSB of the last byte can be a pixel
    expect(SKIN_BITMAP[171] & 0x7f).toBe(0);
  });

  it('pixel (x=17, y=20) → i=757 → byte 94, bit 0x04', () => {
    const i = pixelIndex(17, 20);
    expect(i).toBe(20 * 37 + 17);
    expect(i).toBe(757);
    expect(bytePos(i)).toEqual({ byte: 94, bit: 0x80 >> 5 });
    expect(bytePos(i).bit).toBe(0x04);
    const m = emptyMask();
    setBit(m, i, true);
    expect(m[94]).toBe(0x04);
    expect(Array.from(m).filter((b) => b !== 0)).toHaveLength(1);
    expect(getBit(m, i)).toBe(true);
  });

  it('pixel (0,0) is the MSB of byte 0 and the last pixel (36,36) is the MSB of byte 171', () => {
    const m = emptyMask();
    setBit(m, pixelIndex(0, 0), true);
    setBit(m, pixelIndex(GRID - 1, GRID - 1), true);
    expect(m[0]).toBe(0x80);
    expect(m[171]).toBe(0x80);
  });

  it('brush only touches skin pixels', () => {
    // (0,0) is off-skin; a 3px brush there must not set anything
    expect(isSkinPixel(pixelIndex(0, 0))).toBe(false);
    expect(countErased(paintMask(emptyMask(), 0, 0, 3, true))).toBe(0);
    const randomM = randomMask(() => 0.5);
    expect(bytesToHex(sanitizeMask(randomM))).toBe(bytesToHex(randomM));
  });
});

describe('AZombie traits encoding (uint40)', () => {
  it('slot k sits in bits 8k..8k+7', () => {
    expect(encodeTraits([0, 0, 0, 0, 0])).toBe(0);
    expect(encodeTraits([7, 0, 0, 0, 0])).toBe(7);
    expect(encodeTraits([0, 2, 0, 0, 0])).toBe(0x0200);
    expect(encodeTraits([0, 0, 0, 4, 0])).toBe(0x04000000);
    // WEAPON = slot 4 → bits 32..39 (beyond 32-bit JS bitwise range)
    expect(encodeTraits([0, 0, 0, 0, 3])).toBe(0x0300000000);
    expect(encodeTraits([5, 2, 1, 4, 3])).toBe(0x0304010205);
  });

  it('round-trips', () => {
    expect(decodeTraits(encodeTraits([5, 2, 1, 4, 3]))).toEqual([5, 2, 1, 4, 3]);
    expect(decodeTraits(0x0304010205n)).toEqual([5, 2, 1, 4, 3]);
  });

  it('hooded bodies clear HEAD', () => {
    expect(normalizeTraits([1, 0, 0, 2, 0])).toEqual([1, 0, 0, 0, 0]);
    expect(normalizeTraits([3, 0, 0, 4, 1])).toEqual([3, 0, 0, 0, 1]);
    expect(normalizeTraits([2, 0, 0, 4, 1])).toEqual([2, 0, 0, 4, 1]);
  });
});
