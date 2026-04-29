import { describe, it, expect } from 'vitest';
import { isPaintable, paintableCells, CANVAS_HEIGHT, CANVAS_WIDTH } from '../lib/tshirtMask';

describe('tshirt mask', () => {
  it('exposes 148x148 bounds', () => {
    expect(CANVAS_WIDTH).toBe(148);
    expect(CANVAS_HEIGHT).toBe(148);
  });

  it('rejects out-of-bounds coordinates', () => {
    expect(isPaintable(-1, 0)).toBe(false);
    expect(isPaintable(0, -1)).toBe(false);
    expect(isPaintable(148, 0)).toBe(false);
    expect(isPaintable(0, 148)).toBe(false);
  });

  it('paintableCells iterator yields a non-empty subset of the grid', () => {
    let count = 0;
    for (const _ of paintableCells()) count++;
    // V1 mask has ~2937 paintable cells out of 21904
    expect(count).toBeGreaterThan(2000);
    expect(count).toBeLessThan(CANVAS_WIDTH * CANVAS_HEIGHT);
  });

  it('every yielded cell reports paintable', () => {
    let i = 0;
    for (const cell of paintableCells()) {
      expect(isPaintable(cell.x, cell.y)).toBe(true);
      if (++i >= 100) break;
    }
  });
});
