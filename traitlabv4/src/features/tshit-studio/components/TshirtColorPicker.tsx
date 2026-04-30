/**
 * Pick a colour for the T-shirt itself (the canvas background fill, not the
 * brush colour). Stored as a single store field — every paintable cell not
 * covered by user pixels renders in this colour, multiplied by the template's
 * per-cell luminance so the natural shadows survive.
 */
import { Shirt } from 'lucide-react';
import { useTShitStore } from '../store/tshitStore';
import { RETRO_COLORS } from '../data/palette';

export function TshirtColorPicker() {
  const tshirtBaseColor = useTShitStore(s => s.tshirtBaseColor);
  const setTshirtBaseColor = useTShitStore(s => s.setTshirtBaseColor);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Shirt className="w-4 h-4 text-zinc-400" />
        <span className="text-xs uppercase tracking-wide text-zinc-400">Pick a color for your tshit</span>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => setTshirtBaseColor(null)}
          aria-pressed={tshirtBaseColor === null}
          className={`flex-1 px-2 py-1.5 rounded border text-xs ${
            tshirtBaseColor === null
              ? 'bg-zinc-700 border-zinc-500 text-white'
              : 'bg-zinc-900 border-zinc-700 text-zinc-400 hover:border-zinc-500'
          }`}
        >
          Default grey
        </button>
        <input
          type="color"
          value={tshirtBaseColor ?? '#ffffff'}
          onChange={e => setTshirtBaseColor(e.target.value)}
          className="w-9 h-9 cursor-pointer bg-transparent border border-zinc-700 rounded"
          aria-label="Custom t-shirt color"
        />
      </div>

      <div className="grid grid-cols-8 gap-1.5">
        {RETRO_COLORS.map(c => (
          <button
            key={c}
            onClick={() => setTshirtBaseColor(c)}
            aria-pressed={tshirtBaseColor?.toLowerCase() === c.toLowerCase()}
            className={`w-7 h-7 rounded transition-transform border ${
              tshirtBaseColor?.toLowerCase() === c.toLowerCase()
                ? 'border-emerald-400 scale-110'
                : 'border-zinc-700 hover:scale-105'
            }`}
            style={{ backgroundColor: c }}
            title={c}
          />
        ))}
      </div>
    </div>
  );
}
