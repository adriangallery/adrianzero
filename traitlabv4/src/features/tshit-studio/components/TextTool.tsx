/**
 * Stamp pixel-art text onto the canvas. The user types a string, picks a
 * scale, and clicks "Stamp" — the glyphs are placed centered horizontally on
 * the chest area (y starts at 60, vertically centered for the average T-shirt
 * paint zone). The stamped pixels become a single layer (one undo step).
 */
import { useState } from 'react';
import { Type } from 'lucide-react';
import { useTShitStore } from '../store/tshitStore';
import { renderText, measureText, GLYPH_HEIGHT } from '../data/glyphs';
import { isPaintable, PAINTABLE_BOUNDS } from '../lib/tshirtMask';
import type { Layer } from '../types/tshit.types';

const SCALES: (1 | 2 | 3)[] = [1, 2, 3];

export function TextTool() {
  const [text, setText] = useState('');
  const color = useTShitStore(s => s.color);
  const textScale = useTShitStore(s => s.textScale);
  const setTextScale = useTShitStore(s => s.setTextScale);
  const applyLayer = useTShitStore(s => s.applyLayer);

  const stamp = () => {
    if (!text.trim()) return;
    const glyphPixels = renderText(text, textScale);
    if (glyphPixels.length === 0) return;
    const w = measureText(text, textScale);
    const h = GLYPH_HEIGHT * textScale;
    // Center horizontally on the t-shirt's paintable area; place text in the
    // upper third of that region (chest area, leaves room for year below).
    const ox = Math.max(
      PAINTABLE_BOUNDS.minX,
      PAINTABLE_BOUNDS.centerX - Math.floor(w / 2)
    );
    const oy = Math.max(
      PAINTABLE_BOUNDS.minY,
      PAINTABLE_BOUNDS.minY + Math.floor(PAINTABLE_BOUNDS.height / 4) - Math.floor(h / 2)
    );
    const placed = glyphPixels
      .map(p => ({ x: ox + p.x, y: oy + p.y, color }))
      .filter(p => isPaintable(p.x, p.y));
    if (placed.length === 0) return;
    const layer: Layer = { pixels: placed, origin: 'text' };
    applyLayer(layer);
    setText('');
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Type className="w-4 h-4 text-zinc-400" />
        <span className="text-xs uppercase tracking-wide text-zinc-400">Text</span>
      </div>
      <input
        value={text}
        onChange={e => setText(e.target.value.slice(0, 16))}
        onKeyDown={e => { if (e.key === 'Enter') stamp(); }}
        placeholder="HELLO"
        maxLength={16}
        className="w-full px-2 py-1.5 bg-zinc-900 border border-zinc-700 rounded text-sm text-zinc-100 placeholder:text-zinc-600 font-mono uppercase"
      />
      <div className="flex items-center gap-2">
        <span className="text-xs text-zinc-500">Scale</span>
        {SCALES.map(s => (
          <button
            key={s}
            onClick={() => setTextScale(s)}
            aria-pressed={textScale === s}
            className={`px-2 py-1 rounded border text-xs ${
              textScale === s
                ? 'bg-emerald-500/20 border-emerald-400 text-emerald-200'
                : 'bg-zinc-900 border-zinc-700 text-zinc-400 hover:border-zinc-500'
            }`}
          >
            {s}×
          </button>
        ))}
        <button
          onClick={stamp}
          disabled={!text.trim()}
          className="ml-auto px-3 py-1 rounded text-xs bg-emerald-600/30 border border-emerald-500 text-emerald-100 disabled:opacity-30 hover:bg-emerald-600/50"
        >
          Stamp
        </button>
      </div>
    </div>
  );
}
