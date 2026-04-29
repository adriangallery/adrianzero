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
import { CANVAS_HEIGHT, CANVAS_WIDTH, isPaintable } from '../lib/tshirtMask';
import type { Sticker } from '../types/tshit.types';

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
  const applyLayer = useTShitStore(s => s.applyLayer);
  const [manifest, setManifest] = useState<Sticker[] | null>(null);
  const [stamping, setStamping] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

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
      const pixels = await svgToPixels(s.url, s.width, s.height, color);
      const ox = Math.max(0, Math.floor((CANVAS_WIDTH - s.width) / 2));
      const oy = Math.max(0, Math.min(CANVAS_HEIGHT - s.height, 80 - Math.floor(s.height / 2)));
      const placed = pixels
        .map(p => ({ x: ox + p.x, y: oy + p.y, color: p.color }))
        .filter(p => isPaintable(p.x, p.y));
      if (placed.length === 0) throw new Error('Sticker fell outside paintable area');
      applyLayer({ pixels: placed, origin: 'sticker' });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Sticker stamp failed');
    } finally {
      setStamping(null);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Sparkles className="w-4 h-4 text-zinc-400" />
        <span className="text-xs uppercase tracking-wide text-zinc-400">Stickers</span>
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
        <div className="grid grid-cols-4 gap-2 max-h-48 overflow-y-auto">
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
