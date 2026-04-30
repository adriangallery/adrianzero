/**
 * Zustand store for the T-Shit Studio canvas.
 * - Single source of truth for pixels + tool state.
 * - Layer-based undo/redo (each brush stroke / fill / sticker = one layer).
 * - localStorage autosave handled by useDraftAutosave hook (subscribes here).
 */
import { create } from 'zustand';
import type { Layer, Pixel, Tool } from '../types/tshit.types';
import { DEFAULT_COLOR } from '../data/palette';

const MAX_HISTORY = 30;

/**
 * A movable stamp the user just placed. Lives above the committed layers as
 * a preview the user can drag into position before confirming. On confirm,
 * pixels are filtered through the paintable mask and pushed as a real layer.
 */
export interface PendingStamp {
  /** Sticker/text/year pixels in local coords (origin at the layer's top-left). */
  basePixels: Pixel[];
  /** World-space top-left where basePixels should land. */
  offsetX: number;
  offsetY: number;
  /** Bounding box of basePixels (cached for hit-testing). */
  width: number;
  height: number;
  /** What kind of stamp produced this (used for analytics + commit origin). */
  origin: 'text' | 'year' | 'sticker';
}

interface TShitState {
  // Tool config
  tool: Tool;
  color: string;
  brushSize: 1 | 2 | 4 | 8;
  showGrid: boolean;
  textScale: 1 | 2 | 3;

  // Canvas
  layers: Layer[];           // committed layers (chronological)
  redoStack: Layer[];        // popped layers for redo
  pendingPixels: Map<string, Pixel>; // current in-progress stroke

  // Pending stamp (drag-and-drop layer)
  pendingStamp: PendingStamp | null;

  // Setters
  setTool: (t: Tool) => void;
  setColor: (c: string) => void;
  setBrushSize: (s: 1 | 2 | 4 | 8) => void;
  toggleGrid: () => void;
  setTextScale: (s: 1 | 2 | 3) => void;

  // Drawing primitives
  beginStroke: () => void;
  addPendingPixel: (p: Pixel) => void;
  removePendingPixel: (x: number, y: number) => void;
  commitStroke: (origin?: Layer['origin']) => void;
  cancelStroke: () => void;

  // Atomic operations (skip the pending buffer)
  applyLayer: (layer: Layer) => void;
  fillPaintable: (paintable: (x: number, y: number) => boolean) => void;

  // Pending-stamp lifecycle
  beginPendingStamp: (
    basePixels: Pixel[],
    origin: 'text' | 'year' | 'sticker',
    anchorX: number,
    anchorY: number
  ) => void;
  movePendingStamp: (offsetX: number, offsetY: number) => void;
  commitPendingStamp: (paintable: (x: number, y: number) => boolean) => void;
  cancelPendingStamp: () => void;

  // History
  undo: () => void;
  redo: () => void;
  clear: () => void;

  // Draft / serialise
  getAllPixels: () => Pixel[];
  loadFromPixels: (pixels: Pixel[]) => void;
}

const pkey = (x: number, y: number) => `${x},${y}`;

/**
 * Compose all layers into the final pixel map. Later layers overwrite earlier
 * ones at the same coordinate. Empty pixels (cleared) are represented by an
 * absent entry rather than a sentinel — eraser strokes therefore commit a
 * "remove" layer with negative-color sentinel entries handled below.
 */
function flatten(layers: Layer[]): Map<string, Pixel> {
  const out = new Map<string, Pixel>();
  for (const layer of layers) {
    for (const p of layer.pixels) {
      const key = pkey(p.x, p.y);
      if (p.color === '__erase__') out.delete(key);
      else out.set(key, p);
    }
  }
  return out;
}

export const useTShitStore = create<TShitState>((set, get) => ({
  tool: 'brush',
  color: DEFAULT_COLOR,
  brushSize: 1,
  showGrid: true,
  textScale: 1,

  layers: [],
  redoStack: [],
  pendingPixels: new Map(),
  pendingStamp: null,

  setTool: t => set({ tool: t }),
  setColor: c => set({ color: c }),
  setBrushSize: s => set({ brushSize: s }),
  toggleGrid: () => set(state => ({ showGrid: !state.showGrid })),
  setTextScale: s => set({ textScale: s }),

  beginStroke: () => set({ pendingPixels: new Map() }),

  addPendingPixel: p => {
    const map = get().pendingPixels;
    map.set(pkey(p.x, p.y), p);
    set({ pendingPixels: new Map(map) });
  },

  removePendingPixel: (x, y) => {
    const map = get().pendingPixels;
    map.set(pkey(x, y), { x, y, color: '__erase__' });
    set({ pendingPixels: new Map(map) });
  },

  commitStroke: origin => {
    const pending = get().pendingPixels;
    if (pending.size === 0) return;
    const layer: Layer = { pixels: Array.from(pending.values()), origin };
    const next = [...get().layers, layer].slice(-MAX_HISTORY);
    set({ layers: next, redoStack: [], pendingPixels: new Map() });
  },

  cancelStroke: () => set({ pendingPixels: new Map() }),

  applyLayer: layer => {
    if (layer.pixels.length === 0) return;
    const next = [...get().layers, layer].slice(-MAX_HISTORY);
    set({ layers: next, redoStack: [] });
  },

  beginPendingStamp: (basePixels, origin, anchorX, anchorY) => {
    if (basePixels.length === 0) return;
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const p of basePixels) {
      if (p.x < minX) minX = p.x;
      if (p.y < minY) minY = p.y;
      if (p.x > maxX) maxX = p.x;
      if (p.y > maxY) maxY = p.y;
    }
    // If a previous stamp was still pending, commit-or-discard it: easier UX
    // to auto-commit with the previous filter is impossible without paintable
    // here, so we just discard. (User explicitly clicked a new Stamp button.)
    set({
      pendingStamp: {
        basePixels,
        offsetX: anchorX - minX,
        offsetY: anchorY - minY,
        width: maxX - minX + 1,
        height: maxY - minY + 1,
        origin,
      },
    });
  },

  movePendingStamp: (offsetX, offsetY) => {
    const cur = get().pendingStamp;
    if (!cur) return;
    set({ pendingStamp: { ...cur, offsetX, offsetY } });
  },

  commitPendingStamp: paintable => {
    const cur = get().pendingStamp;
    if (!cur) return;
    const placed = cur.basePixels
      .map(p => ({ x: p.x + cur.offsetX, y: p.y + cur.offsetY, color: p.color }))
      .filter(p => paintable(p.x, p.y));
    set({ pendingStamp: null });
    if (placed.length === 0) return;
    set({
      layers: [...get().layers, { pixels: placed, origin: cur.origin }].slice(-MAX_HISTORY),
      redoStack: [],
    });
  },

  cancelPendingStamp: () => set({ pendingStamp: null }),

  fillPaintable: paintable => {
    const flat = flatten(get().layers);
    const color = get().color;
    const pixels: Pixel[] = [];
    for (let y = 0; y < 148; y++) {
      for (let x = 0; x < 148; x++) {
        if (!paintable(x, y)) continue;
        if (flat.has(pkey(x, y))) continue;
        pixels.push({ x, y, color });
      }
    }
    if (pixels.length === 0) return;
    const layer: Layer = { pixels, origin: 'fill' };
    set({
      layers: [...get().layers, layer].slice(-MAX_HISTORY),
      redoStack: [],
    });
  },

  undo: () => {
    const layers = get().layers;
    if (layers.length === 0) return;
    const last = layers[layers.length - 1];
    set({
      layers: layers.slice(0, -1),
      redoStack: [...get().redoStack, last],
    });
  },

  redo: () => {
    const stack = get().redoStack;
    if (stack.length === 0) return;
    const top = stack[stack.length - 1];
    set({
      layers: [...get().layers, top].slice(-MAX_HISTORY),
      redoStack: stack.slice(0, -1),
    });
  },

  clear: () => set({ layers: [], redoStack: [], pendingPixels: new Map(), pendingStamp: null }),

  getAllPixels: () => {
    const flat = flatten(get().layers);
    return Array.from(flat.values());
  },

  loadFromPixels: pixels => {
    if (pixels.length === 0) {
      set({ layers: [], redoStack: [], pendingStamp: null });
      return;
    }
    set({
      layers: [{ pixels, origin: 'paste' }],
      redoStack: [],
      pendingPixels: new Map(),
      pendingStamp: null,
    });
  },
}));

/**
 * Pure helper — combines committed layers with the in-progress stroke and
 * (if present) the unconfirmed pending stamp the user is dragging. Pass the
 * raw state pieces individually so the caller can subscribe to each and
 * memoise the result.
 */
export function computeVisiblePixels(
  layers: Layer[],
  pendingPixels: Map<string, Pixel>,
  pendingStamp: PendingStamp | null = null
): Pixel[] {
  const flat = flatten(layers);
  for (const p of pendingPixels.values()) {
    if (p.color === '__erase__') flat.delete(pkey(p.x, p.y));
    else flat.set(pkey(p.x, p.y), p);
  }
  if (pendingStamp) {
    for (const p of pendingStamp.basePixels) {
      flat.set(pkey(p.x + pendingStamp.offsetX, p.y + pendingStamp.offsetY), {
        x: p.x + pendingStamp.offsetX,
        y: p.y + pendingStamp.offsetY,
        color: p.color,
      });
    }
  }
  return Array.from(flat.values());
}
