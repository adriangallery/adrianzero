/**
 * Viewport state for the canvas: scale + translate (in CSS pixels).
 * Lives outside useCanvasInteraction so the transform can be applied to the
 * Canvas wrapper while the interaction hook reads the current values via refs
 * to convert client coords back to pixel cells.
 *
 * On desktop scale stays at 1 and pan never activates (pinch needs two
 * pointers, so a mouse can never trigger it).
 */
import { useCallback, useRef, useState } from 'react';

export interface ViewportState {
  scale: number;
  tx: number;
  ty: number;
}

export const VIEWPORT_MIN_SCALE = 1;
export const VIEWPORT_MAX_SCALE = 8;

const IDENTITY: ViewportState = { scale: 1, tx: 0, ty: 0 };

export function useCanvasViewport() {
  const [viewport, setViewportState] = useState<ViewportState>(IDENTITY);
  const viewportRef = useRef<ViewportState>(IDENTITY);

  const setViewport = useCallback((next: ViewportState) => {
    viewportRef.current = next;
    setViewportState(next);
  }, []);

  const reset = useCallback(() => {
    viewportRef.current = IDENTITY;
    setViewportState(IDENTITY);
  }, []);

  return { viewport, viewportRef, setViewport, reset };
}

export function clampScale(s: number): number {
  if (s < VIEWPORT_MIN_SCALE) return VIEWPORT_MIN_SCALE;
  if (s > VIEWPORT_MAX_SCALE) return VIEWPORT_MAX_SCALE;
  return s;
}
