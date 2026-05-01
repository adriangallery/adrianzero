/**
 * Vertical Photoshop-style icon toolbar — tools, brush size, actions.
 * Used by TShitStudioModule on desktop. Mobile uses MobileToolbar.
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

const ICON_BTN =
  'w-11 h-11 flex items-center justify-center rounded-md border transition-colors';
const ICON_OFF =
  'bg-zinc-900 border-zinc-800 text-zinc-300 hover:border-zinc-600 hover:text-white';
const ICON_ON =
  'bg-emerald-500/15 border-emerald-400/70 text-emerald-200';

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
    <div className="flex flex-col items-center gap-1.5 py-3">
      {/* Drawing tools */}
      {TOOLS.map(({ id, icon: Icon, label }) => (
        <button
          key={id}
          onClick={() => setTool(id)}
          aria-pressed={tool === id}
          title={label}
          className={`${ICON_BTN} ${tool === id ? ICON_ON : ICON_OFF}`}
        >
          <Icon className="w-5 h-5" />
        </button>
      ))}

      <Divider />

      {/* Brush size — proportional dot inside a square button so users see
          the actual footprint at a glance. */}
      <div className="grid grid-cols-2 gap-1">
        {BRUSH_SIZES.map(size => (
          <button
            key={size}
            onClick={() => setBrushSize(size)}
            aria-pressed={brushSize === size}
            title={`${size}px brush`}
            className={`w-[22px] h-[22px] flex items-center justify-center rounded-sm border transition-colors ${
              brushSize === size
                ? 'bg-emerald-500/15 border-emerald-400/70'
                : 'bg-zinc-900 border-zinc-800 hover:border-zinc-600'
            }`}
          >
            <span
              className={`rounded-[1px] ${brushSize === size ? 'bg-emerald-300' : 'bg-zinc-400'}`}
              style={{
                // Visual size hint: 1→3px, 2→5px, 4→9px, 8→14px (capped)
                width: Math.min(size * 1.6 + 1.5, 14),
                height: Math.min(size * 1.6 + 1.5, 14),
              }}
            />
          </button>
        ))}
      </div>

      <Divider />

      {/* Actions */}
      <button
        onClick={toggleGrid}
        aria-pressed={showGrid}
        title="Toggle grid"
        className={`${ICON_BTN} ${showGrid ? 'bg-zinc-700/60 border-zinc-500 text-white' : ICON_OFF}`}
      >
        <Grid3x3 className="w-5 h-5" />
      </button>
      <button
        onClick={undo}
        disabled={layers.length === 0}
        title="Undo"
        className={`${ICON_BTN} ${ICON_OFF} disabled:opacity-30 disabled:hover:border-zinc-800`}
      >
        <Undo2 className="w-5 h-5" />
      </button>
      <button
        onClick={redo}
        disabled={redoStack.length === 0}
        title="Redo"
        className={`${ICON_BTN} ${ICON_OFF} disabled:opacity-30 disabled:hover:border-zinc-800`}
      >
        <Redo2 className="w-5 h-5" />
      </button>
      <button
        onClick={() => {
          if (window.confirm('Clear all pixels? This cannot be undone past current history.')) clear();
        }}
        title="Clear all"
        className={`${ICON_BTN} bg-rose-950/40 border-rose-900/70 text-rose-300 hover:bg-rose-900/40 hover:border-rose-700`}
      >
        <Trash2 className="w-5 h-5" />
      </button>
    </div>
  );
}

function Divider() {
  return <div className="w-7 h-px bg-zinc-800 my-1" />;
}
