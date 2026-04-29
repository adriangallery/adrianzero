/**
 * Quick-stamp a year (1-4 digits, accepts apostrophe-prefix like '85).
 * Renders with the active text scale + color.
 */
import { useState } from 'react';
import { Hash } from 'lucide-react';
import { useTShitStore } from '../store/tshitStore';
import { renderText, measureText, GLYPH_HEIGHT } from '../data/glyphs';
import { CANVAS_WIDTH, CANVAS_HEIGHT, isPaintable } from '../lib/tshirtMask';

export function YearTool() {
  const [value, setValue] = useState('');
  const color = useTShitStore(s => s.color);
  const textScale = useTShitStore(s => s.textScale);
  const applyLayer = useTShitStore(s => s.applyLayer);

  const stamp = () => {
    const cleaned = value.trim();
    if (!cleaned) return;
    const allowed = /^'?\d{1,4}$/;
    if (!allowed.test(cleaned)) return;
    const glyphPixels = renderText(cleaned, textScale);
    if (glyphPixels.length === 0) return;
    const w = measureText(cleaned, textScale);
    const h = GLYPH_HEIGHT * textScale;
    const ox = Math.max(0, Math.floor((CANVAS_WIDTH - w) / 2));
    // Place a bit lower than text — typical "year stamp" sits below the main slogan
    const oy = Math.max(0, Math.min(CANVAS_HEIGHT - h, 95 - Math.floor(h / 2)));
    const placed = glyphPixels
      .map(p => ({ x: ox + p.x, y: oy + p.y, color }))
      .filter(p => isPaintable(p.x, p.y));
    if (placed.length === 0) return;
    applyLayer({ pixels: placed, origin: 'text' });
    setValue('');
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Hash className="w-4 h-4 text-zinc-400" />
        <span className="text-xs uppercase tracking-wide text-zinc-400">Year</span>
      </div>
      <div className="flex gap-2">
        <input
          value={value}
          onChange={e => setValue(e.target.value.slice(0, 5))}
          onKeyDown={e => { if (e.key === 'Enter') stamp(); }}
          placeholder="'85 or 1985"
          className="flex-1 px-2 py-1.5 bg-zinc-900 border border-zinc-700 rounded text-sm text-zinc-100 placeholder:text-zinc-600 font-mono"
        />
        <button
          onClick={stamp}
          disabled={!value.trim()}
          className="px-3 py-1 rounded text-xs bg-emerald-600/30 border border-emerald-500 text-emerald-100 disabled:opacity-30 hover:bg-emerald-600/50"
        >
          Stamp
        </button>
      </div>
    </div>
  );
}
