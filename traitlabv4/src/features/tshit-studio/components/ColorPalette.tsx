/**
 * 16-tap retro palette + custom HEX input.
 */
import { useTShitStore } from '../store/tshitStore';
import { RETRO_COLORS } from '../data/palette';

export function ColorPalette() {
  const color = useTShitStore(s => s.color);
  const setColor = useTShitStore(s => s.setColor);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs uppercase tracking-wide text-zinc-400">Color</span>
        <div className="flex items-center gap-2">
          <div
            className="w-6 h-6 rounded border border-zinc-600"
            style={{ backgroundColor: color }}
            aria-label={`Selected color ${color}`}
          />
          <input
            type="color"
            value={color}
            onChange={e => setColor(e.target.value)}
            className="w-8 h-8 cursor-pointer bg-transparent border border-zinc-700 rounded"
            aria-label="Custom color picker"
          />
        </div>
      </div>
      <div className="grid grid-cols-8 gap-1.5">
        {RETRO_COLORS.map(c => (
          <button
            key={c}
            onClick={() => setColor(c)}
            aria-pressed={color.toLowerCase() === c.toLowerCase()}
            className={`w-7 h-7 rounded transition-transform border ${
              color.toLowerCase() === c.toLowerCase()
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
