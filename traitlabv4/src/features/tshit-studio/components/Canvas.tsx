/**
 * 148×148 pixel canvas. Renders three stacked layers:
 *  1. Mannequin (greyed silhouette, behind T-shirt)
 *  2. T-shirt template (paintable area)
 *  3. User pixels (committed + in-progress stroke)
 *  4. Optional grid overlay
 *
 * Pointer events are bound via useCanvasInteraction. The hosted DOM element
 * is sized in CSS pixels — `pixelSize` controls 1 cell = N CSS px.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { useTShitStore, computeVisiblePixels } from '../store/tshitStore';
import { useCanvasInteraction } from '../hooks/useCanvasInteraction';
import { useCanvasViewport } from '../hooks/useCanvasViewport';
import { CANVAS_HEIGHT, CANVAS_WIDTH, MANNEQUIN_SVG_URL, TSHIRT_SVG_URL, isPaintable, shadedAt } from '../lib/tshirtMask';

interface Props {
  /** CSS px per pixel cell. 4 → 592×592 visible canvas. */
  pixelSize?: number;
}

function hexToRgba(hex: string, alpha: number): string {
  const m = /^#?([a-f0-9]{6})$/i.exec(hex.trim());
  if (!m) return hex;
  const n = parseInt(m[1], 16);
  return `rgba(${(n >> 16) & 0xff}, ${(n >> 8) & 0xff}, ${n & 0xff}, ${alpha})`;
}

export function Canvas({ pixelSize = 4 }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const surfaceRef = useRef<HTMLDivElement>(null);
  const [responsiveSize, setResponsiveSize] = useState(pixelSize);

  // Auto-fit pixelSize on small screens
  useEffect(() => {
    const fit = () => {
      if (!containerRef.current) return;
      const w = containerRef.current.clientWidth;
      const max = Math.max(2, Math.floor(w / CANVAS_WIDTH));
      setResponsiveSize(Math.min(pixelSize, max));
    };
    fit();
    window.addEventListener('resize', fit);
    return () => window.removeEventListener('resize', fit);
  }, [pixelSize]);

  const { viewport, viewportRef, setViewport } = useCanvasViewport();
  const { cursorPreview } = useCanvasInteraction({
    canvasEl: surfaceRef.current,
    pixelSize: responsiveSize,
    viewportRef,
    setViewport,
  });

  const tool = useTShitStore(s => s.tool);
  const brushSize = useTShitStore(s => s.brushSize);
  const color = useTShitStore(s => s.color);
  const showGrid = useTShitStore(s => s.showGrid);
  const fillPaintable = useTShitStore(s => s.fillPaintable);
  const pendingStamp = useTShitStore(s => s.pendingStamp);
  const tshirtBaseColor = useTShitStore(s => s.tshirtBaseColor);
  // Subscribe to the raw state pieces (referentially stable) and memoise the
  // derived array. Subscribing to a derived selector that returns a fresh
  // array each call sends React 19 + zustand v5 into an infinite render
  // loop (#185), because the snapshot is "different" on every check.
  const layers = useTShitStore(s => s.layers);
  const pendingPixels = useTShitStore(s => s.pendingPixels);
  const visiblePixels = useMemo(
    () => computeVisiblePixels(layers, pendingPixels, pendingStamp, tshirtBaseColor, isPaintable),
    [layers, pendingPixels, pendingStamp, tshirtBaseColor]
  );

  // Single-tap fill bucket (interaction hook ignores 'fill' to avoid drag spam)
  const handleFillClick = (e: React.MouseEvent) => {
    if (tool !== 'fill') return;
    e.preventDefault();
    fillPaintable(isPaintable);
  };

  const w = CANVAS_WIDTH * responsiveSize;
  const h = CANVAS_HEIGHT * responsiveSize;

  // Pre-render the user pixels via CSS to avoid one DOM node per pixel
  // (a 148×148 grid can hold up to ~22k cells — too much for React's reconciler).
  // We project each pixel into a single inline-block <span> stack via CSS gradient
  // boxes. For typical T-Shit designs (~200-2000 painted pixels) this stays cheap.
  const pixelLayer = useMemo(() => {
    return visiblePixels.map((p, i) => (
      <div
        key={`${p.x}-${p.y}-${i}`}
        style={{
          position: 'absolute',
          left: p.x * responsiveSize,
          top: p.y * responsiveSize,
          width: responsiveSize,
          height: responsiveSize,
          // Multiply the user color by the t-shirt template's per-cell luminance
          // so the original shadows survive — flat fills no longer wash over
          // the natural shading of the shirt.
          backgroundColor: shadedAt(p.x, p.y, p.color),
        }}
      />
    ));
  }, [visiblePixels, responsiveSize]);

  return (
    <div ref={containerRef} className="w-full flex justify-center overflow-hidden">
      <div
        className="relative bg-zinc-900 border border-zinc-700 select-none touch-none"
        style={{
          width: w,
          height: h,
          transform: `translate(${viewport.tx}px, ${viewport.ty}px) scale(${viewport.scale})`,
          transformOrigin: '0 0',
          willChange: viewport.scale !== 1 ? 'transform' : undefined,
        }}
      >
        {/* Mannequin background — scaled to fit canvas, very low opacity */}
        <img
          src={MANNEQUIN_SVG_URL}
          alt=""
          aria-hidden
          draggable={false}
          className="absolute inset-0 pointer-events-none"
          style={{
            width: w,
            height: h,
            imageRendering: 'pixelated',
            opacity: 0.18,
            objectFit: 'contain',
          }}
        />
        {/* T-shirt template */}
        <img
          src={TSHIRT_SVG_URL}
          alt=""
          aria-hidden
          draggable={false}
          className="absolute inset-0 pointer-events-none"
          style={{
            width: w,
            height: h,
            imageRendering: 'pixelated',
            opacity: 0.55,
          }}
        />
        {/* User pixels */}
        <div className="absolute inset-0 pointer-events-none">{pixelLayer}</div>
        {/* Grid overlay */}
        {showGrid && (
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              backgroundImage:
                `linear-gradient(to right, rgba(255,255,255,0.06) 1px, transparent 1px), ` +
                `linear-gradient(to bottom, rgba(255,255,255,0.06) 1px, transparent 1px)`,
              backgroundSize: `${responsiveSize}px ${responsiveSize}px`,
            }}
          />
        )}
        {/* Brush cursor preview — outlines the cells that will be painted next,
            so the user (especially on touch, where the brush is offset above
            the finger) can see exactly where pixels will land. Only meaningful
            for paint tools. */}
        {cursorPreview && (tool === 'brush' || tool === 'eraser' || tool === 'picker') && (
          <div
            className="absolute pointer-events-none"
            style={{
              left: cursorPreview.x * responsiveSize,
              top: cursorPreview.y * responsiveSize,
              width: (tool === 'picker' ? 1 : brushSize) * responsiveSize,
              height: (tool === 'picker' ? 1 : brushSize) * responsiveSize,
              backgroundColor:
                tool === 'brush' ? hexToRgba(color, 0.55) : 'transparent',
              boxShadow:
                tool === 'eraser'
                  ? '0 0 0 1px #fff, 0 0 0 2px #ef4444'
                  : '0 0 0 1px #000, 0 0 0 2px #fff',
            }}
          />
        )}
        {/* Pending stamp bounding box — animated dashed outline so the user
            knows it's still draggable. */}
        {pendingStamp && (
          <div
            className="absolute pointer-events-none"
            style={{
              left: pendingStamp.offsetX * responsiveSize - 2,
              top: pendingStamp.offsetY * responsiveSize - 2,
              width: pendingStamp.width * responsiveSize + 4,
              height: pendingStamp.height * responsiveSize + 4,
              border: '2px dashed rgba(16, 185, 129, 0.85)',
              boxShadow: '0 0 0 1px rgba(0,0,0,0.4)',
              borderRadius: 2,
            }}
          />
        )}
        {/* Pointer surface — top of the stack so it gets every event.
            For brush/eraser/picker we hide the system cursor so the brush
            preview is the only visual indicator (avoids competing with the
            OS crosshair). */}
        <div
          ref={surfaceRef}
          onClick={handleFillClick}
          className="absolute inset-0"
          style={{
            touchAction: 'none',
            cursor:
              tool === 'fill'
                ? 'crosshair'
                : tool === 'brush' || tool === 'eraser' || tool === 'picker'
                  ? 'none'
                  : 'crosshair',
          }}
        />
      </div>
    </div>
  );
}
