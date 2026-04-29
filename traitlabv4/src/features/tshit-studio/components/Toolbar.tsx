/**
 * Tool selector + brush size + clear/undo/redo.
 */
import { Brush, Eraser, PaintBucket, Pipette, Grid3x3, Undo2, Redo2, Trash2 } from 'lucide-react';
import { useTShitStore } from '../store/tshitStore';
import type { Tool } from '../types/tshit.types';

const TOOLS: { id: Tool; icon: typeof Brush; label: string }[] = [
  { id: 'brush',  icon: Brush,       label: 'Brush' },
  { id: 'eraser', icon: Eraser,      label: 'Eraser' },
  { id: 'fill',   icon: PaintBucket, label: 'Fill' },
  { id: 'picker', icon: Pipette,     label: 'Pick' },
];

const BRUSH_SIZES: (1 | 2 | 4 | 8)[] = [1, 2, 4, 8];

export function Toolbar() {
  const tool = useTShitStore(s => s.tool);
  const brushSize = useTShitStore(s => s.brushSize);
  const showGrid = useTShitStore(s => s.showGrid);
  const setTool = useTShitStore(s => s.setTool);
  const setBrushSize = useTShitStore(s => s.setBrushSize);
  const toggleGrid = useTShitStore(s => s.toggleGrid);
  const undo = useTShitStore(s => s.undo);
  const redo = useTShitStore(s => s.redo);
  const clear = useTShitStore(s => s.clear);
  const layers = useTShitStore(s => s.layers);
  const redoStack = useTShitStore(s => s.redoStack);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {TOOLS.map(({ id, icon: Icon, label }) => (
          <button
            key={id}
            onClick={() => setTool(id)}
            aria-pressed={tool === id}
            title={label}
            className={`flex items-center gap-1.5 px-3 py-2 rounded border text-sm ${
              tool === id
                ? 'bg-emerald-500/20 border-emerald-400 text-emerald-200'
                : 'bg-zinc-900 border-zinc-700 text-zinc-300 hover:border-zinc-500'
            }`}
          >
            <Icon className="w-4 h-4" />
            <span className="hidden sm:inline">{label}</span>
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs text-zinc-400 uppercase tracking-wide">Size</span>
        {BRUSH_SIZES.map(size => (
          <button
            key={size}
            onClick={() => setBrushSize(size)}
            aria-pressed={brushSize === size}
            className={`w-9 h-9 rounded border text-xs font-mono ${
              brushSize === size
                ? 'bg-emerald-500/20 border-emerald-400 text-emerald-200'
                : 'bg-zinc-900 border-zinc-700 text-zinc-300 hover:border-zinc-500'
            }`}
          >
            {size}px
          </button>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          onClick={toggleGrid}
          aria-pressed={showGrid}
          title="Toggle grid"
          className={`flex items-center gap-1.5 px-3 py-2 rounded border text-sm ${
            showGrid ? 'bg-zinc-700 border-zinc-500 text-white' : 'bg-zinc-900 border-zinc-700 text-zinc-400'
          }`}
        >
          <Grid3x3 className="w-4 h-4" />
          <span className="hidden sm:inline">Grid</span>
        </button>
        <button
          onClick={undo}
          disabled={layers.length === 0}
          title="Undo"
          className="flex items-center gap-1.5 px-3 py-2 rounded border bg-zinc-900 border-zinc-700 text-zinc-300 disabled:opacity-30 hover:border-zinc-500"
        >
          <Undo2 className="w-4 h-4" />
        </button>
        <button
          onClick={redo}
          disabled={redoStack.length === 0}
          title="Redo"
          className="flex items-center gap-1.5 px-3 py-2 rounded border bg-zinc-900 border-zinc-700 text-zinc-300 disabled:opacity-30 hover:border-zinc-500"
        >
          <Redo2 className="w-4 h-4" />
        </button>
        <button
          onClick={() => {
            if (window.confirm('Clear all pixels? This cannot be undone past current history.')) clear();
          }}
          title="Clear"
          className="flex items-center gap-1.5 px-3 py-2 rounded border bg-rose-950/40 border-rose-800 text-rose-300 hover:bg-rose-900/40"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
