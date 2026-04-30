/**
 * Sticker library — placeholder for Phase 5 content.
 * The library reads /tshit-stickers/manifest.json (lazy-fetched) and renders
 * thumbnails. Clicking a sticker stamps it onto the canvas centered, snapped
 * to the chest area, clipped to the paint mask.
 *
 * If the manifest isn't deployed yet (Phase 5 pending), the panel gracefully
 * shows an empty state instead of erroring.
 */
import { useEffect, useState } from 'react';
import { Sparkles } from 'lucide-react';
import { useTShitStore } from '../store/tshitStore';
import { PAINTABLE_BOUNDS } from '../lib/tshirtMask';
import type { Sticker } from '../types/tshit.types';

const SCALES: (1 | 2 | 3)[] = [1, 2, 3];

const MANIFEST_URL = '/tshit-stickers/manifest.json';

interface ManifestEntry {
  id: string;
  name: string;
  file: string;        // relative to /tshit-stickers/
  width: number;
  height: number;
  category?: string;
}

interface Manifest {
  version: number;
  stickers: ManifestEntry[];
}

function clamp(v: number, lo: number, hi: number): number {
  if (hi < lo) return lo; // sticker bigger than bounds → snap to top-left of region
  return Math.max(lo, Math.min(hi, v));
}

/**
 * Rasterise an SVG <img> to a 2D pixel grid by drawing it to an offscreen
 * canvas at native size and reading the pixels. Returns positions where alpha
 * exceeds the threshold; everything else is treated as transparent.
 */
async function svgToPixels(url: string, w: number, h: number, color: string) {
  const img = new Image();
  img.crossOrigin = 'anonymous';
  img.src = url;
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = () => reject(new Error(`Failed to load ${url}`));
  });
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D not supported');
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(img, 0, 0, w, h);
  const data = ctx.getImageData(0, 0, w, h).data;
  const out: { x: number; y: number; color: string }[] = [];
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const idx = (y * w + x) * 4;
      const alpha = data[idx + 3];
      if (alpha > 64) out.push({ x, y, color });
    }
  }
  return out;
}

export function StickerLibrary() {
  const color = useTShitStore(s => s.color);
  const beginPendingStamp = useTShitStore(s => s.beginPendingStamp);
  const [manifest, setManifest] = useState<Sticker[] | null>(null);
  const [stamping, setStamping] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [scale, setScale] = useState<1 | 2 | 3>(1);

  useEffect(() => {
    let cancelled = false;
    fetch(MANIFEST_URL)
      .then(r => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((m: Manifest) => {
        if (cancelled) return;
        setManifest(
          m.stickers.map(s => ({
            id: s.id,
            name: s.name,
            url: `/tshit-stickers/${s.file}`,
            width: s.width,
            height: s.height,
            category: s.category,
          }))
        );
      })
      .catch(() => {
        if (cancelled) return;
        setManifest([]);
      });
    return () => { cancelled = true; };
  }, []);

  const stamp = async (s: Sticker) => {
    setStamping(s.id);
    setError(null);
    try {
      // Rasterise at sticker's native resolution, then upscale by integer
      // multiples to keep crispEdges intact (avoids canvas resampling blur).
      const basePixels = await svgToPixels(s.url, s.width, s.height, color);
      if (basePixels.length === 0) throw new Error('Sticker has no visible pixels');
      const scaledPixels = scale === 1
        ? basePixels
        : basePixels.flatMap(p => {
            const out = [];
            for (let dy = 0; dy < scale; dy++)
              for (let dx = 0; dx < scale; dx++)
                out.push({ x: p.x * scale + dx, y: p.y * scale + dy, color: p.color });
            return out;
          });
      const sw = s.width * scale;
      const sh = s.height * scale;
      const anchorX = clamp(
        PAINTABLE_BOUNDS.centerX - Math.floor(sw / 2),
        PAINTABLE_BOUNDS.minX,
        PAINTABLE_BOUNDS.maxX - sw + 1
      );
      const anchorY = clamp(
        PAINTABLE_BOUNDS.centerY - Math.floor(sh / 2),
        PAINTABLE_BOUNDS.minY,
        PAINTABLE_BOUNDS.maxY - sh + 1
      );
      beginPendingStamp(scaledPixels, 'sticker', anchorX, anchorY);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Sticker stamp failed');
    } finally {
      setStamping(null);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-zinc-400" />
          <span className="text-xs uppercase tracking-wide text-zinc-400">Stickers</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-[10px] text-zinc-500 mr-1">Scale</span>
          {SCALES.map(s => (
            <button
              key={s}
              onClick={() => setScale(s)}
              aria-pressed={scale === s}
              className={`px-1.5 py-0.5 rounded border text-[11px] ${
                scale === s
                  ? 'bg-emerald-500/20 border-emerald-400 text-emerald-200'
                  : 'bg-zinc-900 border-zinc-700 text-zinc-400 hover:border-zinc-500'
              }`}
            >
              {s}×
            </button>
          ))}
        </div>
      </div>
      {manifest === null && (
        <div className="text-xs text-zinc-500">Loading…</div>
      )}
      {manifest && manifest.length === 0 && (
        <div className="text-xs text-zinc-500 italic">
          Sticker pack coming soon. Use the brush + text tools to design freely.
        </div>
      )}
      {manifest && manifest.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-[60vh] sm:max-h-48 overflow-y-auto">
          {manifest.map(s => (
            <button
              key={s.id}
              onClick={() => stamp(s)}
              disabled={stamping !== null}
              title={s.name}
              className="aspect-square rounded border border-zinc-700 bg-zinc-900 hover:border-zinc-500 disabled:opacity-30 p-1"
            >
              <img
                src={s.url}
                alt={s.name}
                className="w-full h-full object-contain"
                style={{ imageRendering: 'pixelated' }}
              />
            </button>
          ))}
        </div>
      )}
      {error && <div className="text-xs text-rose-400">{error}</div>}
    </div>
  );
}
