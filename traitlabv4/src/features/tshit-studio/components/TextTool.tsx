/**
 * Stamp pixel-art text onto the canvas. The user types a string, picks a
 * scale, and clicks "Stamp" — the glyphs are placed centered horizontally on
 * the chest area (y starts at 60, vertically centered for the average T-shirt
 * paint zone). The stamped pixels become a single layer (one undo step).
 */
import { useState } from 'react';
import { useTShitStore } from '../store/tshitStore';
import { renderText, measureText, GLYPH_HEIGHT } from '../data/glyphs';
import { PAINTABLE_BOUNDS } from '../lib/tshirtMask';
import type { Pixel } from '../types/tshit.types';

const SCALES: (1 | 2 | 3)[] = [1, 2, 3];

/**
 * Generate a 1px contrasting outline around a set of pixels at the given
 * scale. The outline color is derived from the user color: dark text gets a
 * light outline and vice versa. Pixels coincident with the body are
 * suppressed so the outline reads as a halo, not a thicker stroke.
 */
function buildOutline(
  basePixels: { x: number; y: number }[],
  outlineColor: string,
  scale: number
): Pixel[] {
  const occupied = new Set<string>();
  for (const p of basePixels) occupied.add(`${p.x},${p.y}`);
  const out: Pixel[] = [];
  // Cardinal-only outline (4-connected) keeps the halo flush with the glyph
  // at small scales; at larger scales we widen it to `scale` pixels in each
  // direction so the halo stays proportional.
  const offsets: { dx: number; dy: number }[] = [];
  for (let d = 1; d <= scale; d++) {
    offsets.push({ dx: -d, dy: 0 }, { dx: d, dy: 0 }, { dx: 0, dy: -d }, { dx: 0, dy: d });
  }
  // Add corner halo pixels at scale=1 only (avoids "x"-shape look at higher scales)
  if (scale === 1) {
    offsets.push({ dx: -1, dy: -1 }, { dx: 1, dy: -1 }, { dx: -1, dy: 1 }, { dx: 1, dy: 1 });
  }
  const seen = new Set<string>();
  for (const p of basePixels) {
    for (const { dx, dy } of offsets) {
      const x = p.x + dx;
      const y = p.y + dy;
      const k = `${x},${y}`;
      if (occupied.has(k) || seen.has(k)) continue;
      seen.add(k);
      out.push({ x, y, color: outlineColor });
    }
  }
  return out;
}

function isLight(hex: string): boolean {
  if (!hex.startsWith('#') || hex.length < 7) return false;
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return (r * 0.299 + g * 0.587 + b * 0.114) > 128;
}

export function TextTool() {
  const [text, setText] = useState('');
  const [outline, setOutline] = useState(false);
  const color = useTShitStore(s => s.color);
  const textScale = useTShitStore(s => s.textScale);
  const setTextScale = useTShitStore(s => s.setTextScale);
  const beginPendingStamp = useTShitStore(s => s.beginPendingStamp);

  const stamp = () => {
    const value = text.trim();
    if (!value) return;
    const glyphCells = renderText(value, textScale);
    if (glyphCells.length === 0) return;
    const bodyPixels: Pixel[] = glyphCells.map(p => ({ ...p, color }));
    let pixels: Pixel[] = bodyPixels;
    if (outline) {
      // Outline goes BEHIND the glyph body — emit it first so the body wins
      // when both layers cover the same cell after offset normalisation.
      const outlineColor = isLight(color) ? '#000000' : '#ffffff';
      const halo = buildOutline(glyphCells, outlineColor, textScale);
      pixels = [...halo, ...bodyPixels];
    }
    const w = measureText(value, textScale);
    const h = GLYPH_HEIGHT * textScale;
    // Default-anchor on the chest area's upper third; user can drag from there.
    const anchorX = Math.max(
      PAINTABLE_BOUNDS.minX,
      PAINTABLE_BOUNDS.centerX - Math.floor(w / 2)
    );
    const anchorY = Math.max(
      PAINTABLE_BOUNDS.minY,
      PAINTABLE_BOUNDS.minY + Math.floor(PAINTABLE_BOUNDS.height / 4) - Math.floor(h / 2)
    );
    beginPendingStamp(pixels, 'text', anchorX, anchorY);
    setText('');
  };

  return (
    <div className="space-y-2">
      <input
        value={text}
        onChange={e => setText(e.target.value.slice(0, 16))}
        onKeyDown={e => { if (e.key === 'Enter') stamp(); }}
        placeholder="HELLO   '85   1985"
        maxLength={16}
        className="w-full px-2 py-1.5 bg-zinc-900 border border-zinc-700 rounded text-sm text-zinc-100 placeholder:text-zinc-600 font-mono uppercase"
      />
      <div className="flex flex-wrap items-center gap-2">
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
          onClick={() => setOutline(o => !o)}
          aria-pressed={outline}
          className={`px-2 py-1 rounded border text-xs ${
            outline
              ? 'bg-emerald-500/20 border-emerald-400 text-emerald-200'
              : 'bg-zinc-900 border-zinc-700 text-zinc-400 hover:border-zinc-500'
          }`}
          title="Add a contrasting outline around the text"
        >
          Outline
        </button>
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
