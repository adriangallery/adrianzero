import { describe, it, expect } from 'vitest';
import { renderText, measureText, GLYPH_WIDTH, GLYPH_HEIGHT, GLYPH_SPACING } from '../data/glyphs';

describe('pixel font', () => {
  it('measures empty string as zero', () => {
    expect(measureText('')).toBe(0);
  });

  it('measures single char as glyph width', () => {
    expect(measureText('A', 1)).toBe(GLYPH_WIDTH);
    expect(measureText('A', 2)).toBe(GLYPH_WIDTH * 2);
  });

  it('measures multi-char string with spacing between', () => {
    expect(measureText('AB', 1)).toBe(GLYPH_WIDTH * 2 + GLYPH_SPACING);
  });

  it('renders A as a non-empty pixel set', () => {
    const pixels = renderText('A', 1);
    expect(pixels.length).toBeGreaterThan(0);
    // All pixels must be inside the 5x7 glyph box
    for (const p of pixels) {
      expect(p.x).toBeGreaterThanOrEqual(0);
      expect(p.x).toBeLessThan(GLYPH_WIDTH);
      expect(p.y).toBeGreaterThanOrEqual(0);
      expect(p.y).toBeLessThan(GLYPH_HEIGHT);
    }
  });

  it('renders digits 0-9 with at least 5 pixels each', () => {
    for (const d of '0123456789') {
      const pixels = renderText(d, 1);
      expect(pixels.length).toBeGreaterThan(4);
    }
  });

  it('uppercases lowercase input', () => {
    const upper = renderText('A', 1);
    const lower = renderText('a', 1);
    expect(lower.length).toBe(upper.length);
  });

  it('scale 2x produces 4x the pixel count of 1x for same string', () => {
    const one = renderText('Z', 1);
    const two = renderText('Z', 2);
    // each 1px becomes a 2x2 block → 4x pixels
    expect(two.length).toBe(one.length * 4);
  });

  it('scale 3x produces 9x the pixel count of 1x for same string', () => {
    const one = renderText('Z', 1);
    const three = renderText('Z', 3);
    expect(three.length).toBe(one.length * 9);
  });

  it("renders apostrophe-prefixed years like '85", () => {
    const pixels = renderText("'85", 1);
    expect(pixels.length).toBeGreaterThan(10);
    // measure should equal 3 chars worth of width
    expect(measureText("'85", 1)).toBe((GLYPH_WIDTH + GLYPH_SPACING) * 3 - GLYPH_SPACING);
  });

  it('unknown chars are rendered as empty cells (advance cursor without lit pixels)', () => {
    const pixels = renderText('@', 1); // not in glyph table
    expect(pixels.length).toBe(0);
  });
});
