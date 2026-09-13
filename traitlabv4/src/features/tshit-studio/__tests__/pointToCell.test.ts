import { describe, it, expect } from 'vitest';
import { pointToCell } from '../hooks/useCanvasInteraction';

describe('pointToCell (pointer → grid cell mapping)', () => {
  it('maps a centered touch on a scaled-up rect to the matching cell', () => {
    // Ticket's worked example: rect rendered at 300x300 CSS px for a 64x64
    // logical grid, touch at (150,150) (dead center) → cell (32,32).
    const rect = { left: 0, top: 0, width: 300, height: 300 };
    expect(pointToCell(150, 150, rect, 64, 64)).toEqual({ x: 32, y: 32 });
  });

  it('accounts for the rect being offset from the viewport origin', () => {
    const rect = { left: 40, top: 20, width: 300, height: 300 };
    // Same relative position as above (150,150 within the rect) but the
    // rect itself doesn't start at (0,0) — a scrolled/sticky canvas.
    expect(pointToCell(190, 170, rect, 64, 64)).toEqual({ x: 32, y: 32 });
  });

  it('maps the real T-Shit Studio grid (148x148) at the mobile auto-fit size', () => {
    // pixelSize=2 auto-fit on a 390px phone → rendered rect is 296x296.
    const rect = { left: 47, top: 100, width: 296, height: 296 };
    // Tap dead-center of the rendered canvas should land dead-center of the grid.
    expect(pointToCell(47 + 148, 100 + 148, rect, 148, 148)).toEqual({ x: 74, y: 74 });
  });

  it('clamps to the top-left cell for a touch at the rect origin', () => {
    const rect = { left: 10, top: 10, width: 300, height: 300 };
    expect(pointToCell(10, 10, rect, 64, 64)).toEqual({ x: 0, y: 0 });
  });

  it('returns null for a zero-size rect (e.g. measured before layout)', () => {
    const rect = { left: 0, top: 0, width: 0, height: 0 };
    expect(pointToCell(10, 10, rect, 64, 64)).toBeNull();
  });

  it('is robust to CSS scaling that makes rect.width diverge from pixelSize*grid', () => {
    // Even if some ancestor transform/border ends up shrinking the rendered
    // rect relative to what `pixelSize * gridWidth` would predict, mapping
    // by the rect/grid RATIO still lands on the correct cell — unlike a
    // fixed division by an assumed pixelSize.
    const gridWidth = 148;
    const assumedPixelSize = 2;
    const idealWidth = gridWidth * assumedPixelSize; // 296
    const actualRenderedWidth = idealWidth - 4; // e.g. a 2px border each side
    const rect = { left: 0, top: 0, width: actualRenderedWidth, height: actualRenderedWidth };
    const cell = pointToCell(actualRenderedWidth / 2, actualRenderedWidth / 2, rect, gridWidth, gridWidth);
    expect(cell).toEqual({ x: 74, y: 74 });
  });
});
