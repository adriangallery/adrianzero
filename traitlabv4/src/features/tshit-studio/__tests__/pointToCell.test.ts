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

  // Bounds checks (critic review, round 4): the touch paint offset can push
  // a point above the canvas' top edge, and Pointer Capture keeps delivering
  // move/up events to the canvas element even once the finger has dragged
  // past its bottom/sides mid-stroke — both are normal occurrences, not
  // theoretical edge cases, and must map to `null` (don't paint) rather than
  // an out-of-grid `{x,y}` that a naive caller could use as if valid.

  it('returns null when clientY is above the rect (touch offset pushed above the top edge)', () => {
    const rect = { left: 0, top: 100, width: 300, height: 300 };
    // 40px above rect.top — e.g. a touch near row 0 with the finger-clearance offset applied.
    expect(pointToCell(150, 60, rect, 64, 64)).toBeNull();
  });

  it('returns null when clientY is below the rect (pointer capture dragged past the bottom edge)', () => {
    const rect = { left: 0, top: 0, width: 300, height: 300 };
    // Past rect.bottom (300) — finger dragged off the canvas onto the toolbar below, still captured.
    expect(pointToCell(150, 340, rect, 64, 64)).toBeNull();
  });

  it('returns null when clientX is left/right of the rect (pointer capture dragged past a side)', () => {
    const rect = { left: 50, top: 50, width: 300, height: 300 };
    expect(pointToCell(20, 150, rect, 64, 64)).toBeNull(); // left of rect.left
    expect(pointToCell(400, 150, rect, 64, 64)).toBeNull(); // right of rect.right
  });

  it('returns null exactly at the far edges (clientX/Y === rect.right/bottom, one past the last cell)', () => {
    const rect = { left: 0, top: 0, width: 300, height: 300 };
    // At the exact bottom-right corner the ratio lands exactly on gridWidth/gridHeight,
    // one cell past the last valid index (gridWidth-1) — must reject, not clamp.
    expect(pointToCell(300, 300, rect, 64, 64)).toBeNull();
    // One CSS px inside is still the last valid cell.
    expect(pointToCell(299.9, 299.9, rect, 64, 64)).toEqual({ x: 63, y: 63 });
  });

  it('maps a non-square rect against a non-square grid independently per axis', () => {
    // 300x150 rect for a 64x32 grid — x and y each use their OWN ratio
    // (gridWidth/rect.width vs gridHeight/rect.height), not a single shared scale.
    const rect = { left: 0, top: 0, width: 300, height: 150 };
    expect(pointToCell(150, 75, rect, 64, 32)).toEqual({ x: 32, y: 16 }); // center
    expect(pointToCell(0, 0, rect, 64, 32)).toEqual({ x: 0, y: 0 }); // top-left
    expect(pointToCell(299, 149, rect, 64, 32)).toEqual({ x: 63, y: 31 }); // bottom-right-ish, still in bounds
    expect(pointToCell(300, 150, rect, 64, 32)).toBeNull(); // exactly at the far corner → out
  });

  it('maps a non-square rect against a SQUARE grid (width and height scale differently)', () => {
    // A 400x200 rect (2:1) mapped onto a 148x148 square grid: the same
    // client-space displacement means a different cell displacement on each
    // axis, since horizontal and vertical scale factors differ.
    const rect = { left: 0, top: 0, width: 400, height: 200 };
    // 40px right → 40/400*148 ≈ 14.8 → floor 14. 40px down → 40/200*148 ≈ 29.6 → floor 29.
    expect(pointToCell(40, 40, rect, 148, 148)).toEqual({ x: 14, y: 29 });
  });
});
