/**
 * Bind pointer events from the canvas DOM to the store. Handles:
 *  - mouse + pointer + touch (single pointer wins, palm rejection ignores extras)
 *  - brush size 1/2/4/8 stamping a square at the pointer cell
 *  - eraser uses the same square footprint
 *  - color picker reads the topmost pixel under the pointer
 *  - mask gating (no painting outside the T-shirt)
 *
 * The hook is canvas-agnostic — it just needs (1) a ref to the drawing element
 * and (2) the current pixelSize at which the canvas is rendered, so it can
 * convert client coords to pixel coords.
 */
import { useCallback, useEffect, useRef } from 'react';
import { useTShitStore } from '../store/tshitStore';
import { isPaintable } from '../lib/tshirtMask';

interface Args {
  /** The canvas DOM element receiving events. */
  canvasEl: HTMLElement | null;
  /** Visual pixel size of one canvas cell (e.g. 4 = each painted cell is 4 CSS px). */
  pixelSize: number;
}

type DragMode = 'paint' | 'stamp';

export function useCanvasInteraction({ canvasEl, pixelSize }: Args) {
  const activePointerId = useRef<number | null>(null);
  const dragModeRef = useRef<DragMode>('paint');
  const lastCellRef = useRef<{ x: number; y: number } | null>(null);
  const stampGrabOffsetRef = useRef<{ dx: number; dy: number } | null>(null);
  // Subscribe to individual store fields rather than calling useTShitStore()
  // bare — the latter returns the entire state object whose reference changes
  // on every mutation and provokes infinite re-renders under React 19 +
  // zustand v5. Actions are stable refs grabbed via getState() (no subscription).
  const tool = useTShitStore(s => s.tool);
  const color = useTShitStore(s => s.color);
  const brushSize = useTShitStore(s => s.brushSize);
  const beginStroke = useTShitStore(s => s.beginStroke);
  const addPendingPixel = useTShitStore(s => s.addPendingPixel);
  const removePendingPixel = useTShitStore(s => s.removePendingPixel);
  const commitStroke = useTShitStore(s => s.commitStroke);
  const cancelStroke = useTShitStore(s => s.cancelStroke);
  const setColor = useTShitStore(s => s.setColor);
  const getAllPixels = useTShitStore(s => s.getAllPixels);
  const movePendingStamp = useTShitStore(s => s.movePendingStamp);

  // Convert client (x,y) to canvas cell coords
  const cellFromClient = useCallback(
    (clientX: number, clientY: number) => {
      if (!canvasEl) return null;
      const rect = canvasEl.getBoundingClientRect();
      const cx = Math.floor((clientX - rect.left) / pixelSize);
      const cy = Math.floor((clientY - rect.top) / pixelSize);
      return { x: cx, y: cy };
    },
    [canvasEl, pixelSize]
  );

  const stamp = useCallback(
    (x: number, y: number) => {
      const size = brushSize;
      for (let dy = 0; dy < size; dy++) {
        for (let dx = 0; dx < size; dx++) {
          const px = x + dx;
          const py = y + dy;
          if (!isPaintable(px, py)) continue;
          if (tool === 'eraser') {
            removePendingPixel(px, py);
          } else {
            addPendingPixel({ x: px, y: py, color });
          }
        }
      }
    },
    [addPendingPixel, brushSize, color, removePendingPixel, tool]
  );

  // Bresenham-ish interpolation between last cell and current to avoid gaps
  // when the user drags fast.
  const drawLine = useCallback(
    (from: { x: number; y: number }, to: { x: number; y: number }) => {
      const dx = Math.abs(to.x - from.x);
      const dy = Math.abs(to.y - from.y);
      const sx = from.x < to.x ? 1 : -1;
      const sy = from.y < to.y ? 1 : -1;
      let err = dx - dy;
      let { x, y } = from;
      while (true) {
        stamp(x, y);
        if (x === to.x && y === to.y) break;
        const e2 = err * 2;
        if (e2 > -dy) { err -= dy; x += sx; }
        if (e2 <  dx) { err += dx; y += sy; }
      }
    },
    [stamp]
  );

  useEffect(() => {
    if (!canvasEl) return;

    const isInsideStamp = (cell: { x: number; y: number }) => {
      const ps = useTShitStore.getState().pendingStamp;
      if (!ps) return null;
      const left = ps.offsetX;
      const right = ps.offsetX + ps.width - 1;
      const top = ps.offsetY;
      const bottom = ps.offsetY + ps.height - 1;
      if (cell.x < left || cell.x > right || cell.y < top || cell.y > bottom) return null;
      return ps;
    };

    const onDown = (e: PointerEvent) => {
      if (activePointerId.current !== null) return; // palm rejection
      const cell = cellFromClient(e.clientX, e.clientY);
      if (!cell) return;
      activePointerId.current = e.pointerId;
      canvasEl.setPointerCapture?.(e.pointerId);
      e.preventDefault();

      // Pending stamp drag-and-drop takes precedence over paint tools so the
      // user can re-grab the layer they just spawned without thinking about
      // tool state.
      const stampHit = isInsideStamp(cell);
      if (stampHit) {
        dragModeRef.current = 'stamp';
        stampGrabOffsetRef.current = {
          dx: cell.x - stampHit.offsetX,
          dy: cell.y - stampHit.offsetY,
        };
        return;
      }

      dragModeRef.current = 'paint';
      stampGrabOffsetRef.current = null;

      if (tool === 'picker') {
        const all = getAllPixels();
        const hit = all.find(p => p.x === cell.x && p.y === cell.y);
        if (hit) setColor(hit.color);
        activePointerId.current = null;
        return;
      }

      beginStroke();
      lastCellRef.current = cell;
      stamp(cell.x, cell.y);
    };

    const onMove = (e: PointerEvent) => {
      if (activePointerId.current !== e.pointerId) return;
      const cell = cellFromClient(e.clientX, e.clientY);
      if (!cell) return;

      if (dragModeRef.current === 'stamp') {
        const grab = stampGrabOffsetRef.current;
        if (!grab) return;
        movePendingStamp(cell.x - grab.dx, cell.y - grab.dy);
        return;
      }

      if (!lastCellRef.current) return;
      if (cell.x === lastCellRef.current.x && cell.y === lastCellRef.current.y) return;
      drawLine(lastCellRef.current, cell);
      lastCellRef.current = cell;
    };

    const finish = (commit: boolean) => {
      if (dragModeRef.current === 'paint') {
        if (commit) commitStroke(tool === 'eraser' ? 'brush' : 'brush');
        else cancelStroke();
      }
      activePointerId.current = null;
      lastCellRef.current = null;
      stampGrabOffsetRef.current = null;
      dragModeRef.current = 'paint';
    };

    const onUp = (e: PointerEvent) => {
      if (activePointerId.current !== e.pointerId) return;
      finish(true);
    };

    const onCancel = (e: PointerEvent) => {
      if (activePointerId.current !== e.pointerId) return;
      finish(false);
    };

    canvasEl.addEventListener('pointerdown', onDown);
    canvasEl.addEventListener('pointermove', onMove);
    canvasEl.addEventListener('pointerup', onUp);
    canvasEl.addEventListener('pointercancel', onCancel);
    canvasEl.addEventListener('pointerleave', onUp);

    return () => {
      canvasEl.removeEventListener('pointerdown', onDown);
      canvasEl.removeEventListener('pointermove', onMove);
      canvasEl.removeEventListener('pointerup', onUp);
      canvasEl.removeEventListener('pointercancel', onCancel);
      canvasEl.removeEventListener('pointerleave', onUp);
    };
  }, [canvasEl, beginStroke, cancelStroke, cellFromClient, commitStroke, drawLine, getAllPixels, movePendingStamp, setColor, stamp, tool]);
}
