import { describe, it, expect } from 'vitest';
import { renderText, measureText, GLYPH_WIDTH, GLYPH_HEIGHT, GLYPH_SPACING } from '../data/glyphs';

describe('pixel font (thin / bold=false)', () => {
  it('measures empty string as zero', () => {
    expect(measureText('', 1, false)).toBe(0);
  });

  it('measures single char as glyph width', () => {
    expect(measureText('A', 1, false)).toBe(GLYPH_WIDTH);
    expect(measureText('A', 2, false)).toBe(GLYPH_WIDTH * 2);
  });

  it('measures multi-char string with spacing between', () => {
    expect(measureText('AB', 1, false)).toBe(GLYPH_WIDTH * 2 + GLYPH_SPACING);
  });

  it('renders A as a non-empty pixel set', () => {
    const pixels = renderText('A', 1, false);
    expect(pixels.length).toBeGreaterThan(0);
    for (const p of pixels) {
      expect(p.x).toBeGreaterThanOrEqual(0);
      expect(p.x).toBeLessThan(GLYPH_WIDTH);
      expect(p.y).toBeGreaterThanOrEqual(0);
      expect(p.y).toBeLessThan(GLYPH_HEIGHT);
    }
  });

  it('renders digits 0-9 with at least 5 pixels each', () => {
    for (const d of '0123456789') {
      const pixels = renderText(d, 1, false);
      expect(pixels.length).toBeGreaterThan(4);
    }
  });

  it('uppercases lowercase input', () => {
    const upper = renderText('A', 1, false);
    const lower = renderText('a', 1, false);
    expect(lower.length).toBe(upper.length);
  });

  it('scale 2x produces 4x the pixel count of 1x for same string', () => {
    const one = renderText('Z', 1, false);
    const two = renderText('Z', 2, false);
    expect(two.length).toBe(one.length * 4);
  });

  it('scale 3x produces 9x the pixel count of 1x for same string', () => {
    const one = renderText('Z', 1, false);
    const three = renderText('Z', 3, false);
    expect(three.length).toBe(one.length * 9);
  });

  it("renders apostrophe-prefixed years like '85", () => {
    const pixels = renderText("'85", 1, false);
    expect(pixels.length).toBeGreaterThan(10);
    expect(measureText("'85", 1, false)).toBe((GLYPH_WIDTH + GLYPH_SPACING) * 3 - GLYPH_SPACING);
  });

  it('unknown chars are rendered as empty cells (advance cursor without lit pixels)', () => {
    const pixels = renderText('@', 1, false);
    expect(pixels.length).toBe(0);
  });
});

describe('pixel font (bold default)', () => {
  it('bold doubles pixel count of single-thickness strokes', () => {
    const thin = renderText('A', 1, false);
    const bold = renderText('A', 1, true);
    expect(bold.length).toBe(thin.length * 2);
  });

  it('bold widens char advance by one cell at scale 1', () => {
    const thin = measureText('AB', 1, false);
    const bold = measureText('AB', 1, true);
    expect(bold - thin).toBe(2); // +1 cell per char (×2 chars)
  });

  it('default render uses bold', () => {
    const explicit = renderText('A', 1, true);
    const def = renderText('A', 1);
    expect(def.length).toBe(explicit.length);
  });
});
