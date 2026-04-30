import {
  Brush,
  Eraser,
  PaintBucket,
  Pipette,
  Undo2,
  Redo2,
  Sparkles,
  Shirt,
  Grid3x3,
  Trash2,
  Flame,
} from 'lucide-react';
import { useTShitStore } from '../store/tshitStore';
import type { Tool } from '../types/tshit.types';

const TOOLS: { id: Tool; icon: typeof Brush; label: string }[] = [
  { id: 'brush', icon: Brush, label: 'Brush' },
  { id: 'eraser', icon: Eraser, label: 'Eraser' },
  { id: 'fill', icon: PaintBucket, label: 'Fill' },
  { id: 'picker', icon: Pipette, label: 'Pick' },
];

const BRUSH_SIZES: (1 | 2 | 4 | 8)[] = [1, 2, 4, 8];

export type MobileSheet = 'color' | 'stickers' | 'tshirt' | 'mint' | null;

interface Props {
  onOpenSheet: (sheet: MobileSheet) => void;
  isConnected: boolean;
}

export function MobileToolbar({ onOpenSheet, isConnected }: Props) {
  const tool = useTShitStore(s => s.tool);
  const setTool = useTShitStore(s => s.setTool);
  const color = useTShitStore(s => s.color);
  const brushSize = useTShitStore(s => s.brushSize);
  const setBrushSize = useTShitStore(s => s.setBrushSize);
  const undo = useTShitStore(s => s.undo);
  const redo = useTShitStore(s => s.redo);
  const clear = useTShitStore(s => s.clear);
  const showGrid = useTShitStore(s => s.showGrid);
  const toggleGrid = useTShitStore(s => s.toggleGrid);
  const layers = useTShitStore(s => s.layers);
  const redoStack = useTShitStore(s => s.redoStack);

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-30 lg:hidden border-t border-zinc-800 bg-zinc-950/95 backdrop-blur"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      {/* Row 1: paint tools + color + size + history */}
      <div className="flex items-center gap-1.5 px-2 pt-2 pb-1.5 overflow-x-auto">
        {TOOLS.map(({ id, icon: Icon, label }) => (
          <button
            key={id}
            onClick={() => setTool(id)}
            aria-pressed={tool === id}
            aria-label={label}
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded border ${
              tool === id
                ? 'bg-emerald-500/20 border-emerald-400 text-emerald-200'
                : 'bg-zinc-900 border-zinc-700 text-zinc-300'
            }`}
          >
            <Icon className="h-4 w-4" />
          </button>
        ))}

        <button
          onClick={() => onOpenSheet('color')}
          aria-label={`Color ${color}`}
          title={`Color ${color}`}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded border border-zinc-700 bg-zinc-900"
        >
          <span
            className="h-6 w-6 rounded border border-zinc-600"
            style={{ backgroundColor: color }}
          />
        </button>

        <div className="flex shrink-0 items-center gap-0.5 rounded border border-zinc-700 bg-zinc-900 p-0.5">
          {BRUSH_SIZES.map(size => (
            <button
              key={size}
              onClick={() => setBrushSize(size)}
              aria-pressed={brushSize === size}
              className={`h-9 w-9 rounded text-[11px] font-mono ${
                brushSize === size
                  ? 'bg-emerald-500/30 text-emerald-200'
                  : 'text-zinc-400'
              }`}
            >
              {size}
            </button>
          ))}
        </div>

        <button
          onClick={undo}
          disabled={layers.length === 0}
          aria-label="Undo"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded border border-zinc-700 bg-zinc-900 text-zinc-300 disabled:opacity-30"
        >
          <Undo2 className="h-4 w-4" />
        </button>
        <button
          onClick={redo}
          disabled={redoStack.length === 0}
          aria-label="Redo"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded border border-zinc-700 bg-zinc-900 text-zinc-300 disabled:opacity-30"
        >
          <Redo2 className="h-4 w-4" />
        </button>
      </div>

      {/* Row 2: sheet triggers + mint (icons only, mint stays labeled) */}
      <div className="flex items-center gap-1.5 px-2 pb-2">
        <button
          onClick={() => onOpenSheet('stickers')}
          aria-label="Stickers and text"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded border border-zinc-700 bg-zinc-900 text-zinc-300"
        >
          <Sparkles className="h-4 w-4" />
        </button>
        <button
          onClick={() => onOpenSheet('tshirt')}
          aria-label="T-shirt color"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded border border-zinc-700 bg-zinc-900 text-zinc-300"
        >
          <Shirt className="h-4 w-4" />
        </button>
        <button
          onClick={toggleGrid}
          aria-pressed={showGrid}
          aria-label="Toggle grid"
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded border ${
            showGrid
              ? 'bg-zinc-700 border-zinc-500 text-white'
              : 'bg-zinc-900 border-zinc-700 text-zinc-400'
          }`}
        >
          <Grid3x3 className="h-4 w-4" />
        </button>
        <button
          onClick={() => {
            if (window.confirm('Clear all pixels? This cannot be undone past current history.')) {
              clear();
            }
          }}
          aria-label="Clear canvas"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded border border-rose-800 bg-rose-950/40 text-rose-300"
        >
          <Trash2 className="h-4 w-4" />
        </button>

        <button
          onClick={() => onOpenSheet('mint')}
          disabled={!isConnected}
          aria-label="Mint"
          className="ml-auto flex h-10 min-w-0 flex-1 items-center justify-center gap-1.5 rounded bg-emerald-600 px-3 text-xs font-bold uppercase tracking-wide text-white disabled:opacity-40"
        >
          <Flame className="h-4 w-4" />
          <span className="truncate">{isConnected ? 'Mint' : 'Connect'}</span>
        </button>
      </div>
    </div>
  );
}
