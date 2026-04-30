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
import { CANVAS_HEIGHT, CANVAS_WIDTH, MANNEQUIN_SVG_URL, TSHIRT_SVG_URL, isPaintable, shadedAt } from '../lib/tshirtMask';

interface Props {
  /** CSS px per pixel cell. 4 → 592×592 visible canvas. */
  pixelSize?: number;
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

  useCanvasInteraction({ canvasEl: surfaceRef.current, pixelSize: responsiveSize });

  const tool = useTShitStore(s => s.tool);
  const showGrid = useTShitStore(s => s.showGrid);
  const fillPaintable = useTShitStore(s => s.fillPaintable);
  const pendingStamp = useTShitStore(s => s.pendingStamp);
  // Subscribe to the raw state pieces (referentially stable) and memoise the
  // derived array. Subscribing to a derived selector that returns a fresh
  // array each call sends React 19 + zustand v5 into an infinite render
  // loop (#185), because the snapshot is "different" on every check.
  const layers = useTShitStore(s => s.layers);
  const pendingPixels = useTShitStore(s => s.pendingPixels);
  const visiblePixels = useMemo(
    () => computeVisiblePixels(layers, pendingPixels, pendingStamp),
    [layers, pendingPixels, pendingStamp]
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
    <div ref={containerRef} className="w-full flex justify-center">
      <div
        className="relative bg-zinc-900 border border-zinc-700 select-none touch-none"
        style={{ width: w, height: h }}
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
        {/* Pointer surface — top of the stack so it gets every event */}
        <div
          ref={surfaceRef}
          onClick={handleFillClick}
          className={tool === 'fill' ? 'absolute inset-0 cursor-crosshair' : 'absolute inset-0 cursor-crosshair'}
          style={{ touchAction: 'none' }}
        />
      </div>
    </div>
  );
}
