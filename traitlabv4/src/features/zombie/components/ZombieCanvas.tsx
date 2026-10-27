/**
 * 37×37 AZombie canvas, scaled up with CSS (integer factor, pixelated).
 * Interactive mode paints the skin mask with pointer events (mouse + finger).
 */

import { useEffect, useRef } from 'react';
import { GRID } from '../lib/zombieSpec';
import { drawZombie, type LayerSet } from '../lib/render';
import { linePoints } from '../lib/encoding';

interface ZombieCanvasProps {
  layers: LayerSet | null;
  mask: Uint8Array;
  traits: readonly number[];
  variant?: number;
  className?: string;
  label?: string;
  /** Called once per stroke, before the first painted point (undo snapshot). */
  onStrokeStart?: () => void;
  /** Grid points covered since the last event (already interpolated). */
  onPaint?: (points: Array<[number, number]>) => void;
}

export function ZombieCanvas({
  layers,
  mask,
  traits,
  variant = 0,
  className = '',
  label = 'AZombie preview',
  onStrokeStart,
  onPaint,
}: ZombieCanvasProps) {
  const ref = useRef<HTMLCanvasElement>(null);
  const last = useRef<[number, number] | null>(null);
  const interactive = !!onPaint;

  useEffect(() => {
    const ctx = ref.current?.getContext('2d');
    if (!ctx || !layers) return;
    drawZombie(ctx, layers, mask, traits, variant);
  }, [layers, mask, traits, variant]);

  const toGrid = (e: React.PointerEvent<HTMLCanvasElement>): [number, number] => {
    const r = e.currentTarget.getBoundingClientRect();
    const x = Math.floor(((e.clientX - r.left) / r.width) * GRID);
    const y = Math.floor(((e.clientY - r.top) / r.height) * GRID);
    return [Math.min(GRID - 1, Math.max(0, x)), Math.min(GRID - 1, Math.max(0, y))];
  };

  return (
    <canvas
      ref={ref}
      width={GRID}
      height={GRID}
      role={interactive ? 'application' : 'img'}
      aria-label={label}
      className={`az-pixel block ${interactive ? 'cursor-crosshair touch-none select-none' : ''} ${className}`}
      onPointerDown={
        interactive
          ? (e) => {
              if (e.button !== 0 && e.pointerType === 'mouse') return;
              e.preventDefault();
              e.currentTarget.setPointerCapture(e.pointerId);
              const p = toGrid(e);
              last.current = p;
              onStrokeStart?.();
              onPaint?.([p]);
            }
          : undefined
      }
      onPointerMove={
        interactive
          ? (e) => {
              if (!last.current) return;
              const p = toGrid(e);
              const [lx, ly] = last.current;
              if (p[0] === lx && p[1] === ly) return;
              onPaint?.(linePoints(lx, ly, p[0], p[1]).slice(1));
              last.current = p;
            }
          : undefined
      }
      onPointerUp={interactive ? () => (last.current = null) : undefined}
      onPointerCancel={interactive ? () => (last.current = null) : undefined}
      onContextMenu={interactive ? (e) => e.preventDefault() : undefined}
    />
  );
}

/** Small cropped thumbnail of one trait layer (alpha bbox, centered). */
export function TraitThumb({ layers, file, className = '' }: { layers: LayerSet | null; file: string; className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current;
    const ctx = c?.getContext('2d');
    if (!c || !ctx || !layers) return;
    const b = layers.bbox[file];
    const side = Math.max(b.w, b.h) + 2;
    c.width = side;
    c.height = side;
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, side, side);
    ctx.drawImage(
      layers.imgs[file],
      b.x, b.y, b.w, b.h,
      Math.floor((side - b.w) / 2), Math.floor((side - b.h) / 2), b.w, b.h
    );
  }, [layers, file]);
  return <canvas ref={ref} aria-hidden className={`az-pixel block ${className}`} />;
}
