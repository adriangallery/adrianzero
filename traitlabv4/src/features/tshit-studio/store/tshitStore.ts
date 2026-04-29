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

  clear: () => set({ layers: [], redoStack: [], pendingPixels: new Map() }),

  getAllPixels: () => {
    const flat = flatten(get().layers);
    return Array.from(flat.values());
  },

  loadFromPixels: pixels => {
    if (pixels.length === 0) {
      set({ layers: [], redoStack: [] });
      return;
    }
    set({
      layers: [{ pixels, origin: 'paste' }],
      redoStack: [],
      pendingPixels: new Map(),
    });
  },
}));

/**
 * Pure helper — combines committed layers with the in-progress stroke so the
 * user sees their brush as they paint. Pass the raw state pieces (not the
 * whole store) so the caller can subscribe to those individually and memoise
 * the result. Subscribing to a selector that returns a fresh derived array
 * every call sends React 19 + zustand v5 into render-loop territory.
 */
export function computeVisiblePixels(
  layers: Layer[],
  pendingPixels: Map<string, Pixel>
): Pixel[] {
  const flat = flatten(layers);
  for (const p of pendingPixels.values()) {
    if (p.color === '__erase__') flat.delete(pkey(p.x, p.y));
    else flat.set(pkey(p.x, p.y), p);
  }
  return Array.from(flat.values());
}
