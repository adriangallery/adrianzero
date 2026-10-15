/**
 * /grid — generador de grids de ZERO para redes (15-oct-2026, pedido de Adrián:
 * «el de GM ZERO, dame un enlace en adrianzero.com que me los genere»).
 * Por defecto el «GM ZERO» 6×3 para X. Todo en el navegador (canvas): renders
 * públicos de AdrianLAB, sin claves ni nada on-chain. Los ajustes viven en la URL
 * (?format=&theme=&title=&seed=&ids=), así un enlace reproduce el mismo grid.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Button } from '@/ui';
import { cn } from '@/ui/cn';
import { chooseIds, drawGrid, FORMATS, MAX_TOKENS, parseIds } from '../lib/zeroGrid';
import type { GridFormat, GridTheme } from '../lib/zeroGrid';

const DEFAULT_TITLE = 'GM ZERO';
const newSeed = () => Math.floor(Math.random() * 2 ** 31);

function Segmented<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="font-ui text-xs uppercase tracking-wider text-mute">{label}</span>
      <div className="grid gap-1 rounded-[var(--r-md)] border-2 border-line p-1" style={{ gridTemplateColumns: `repeat(${options.length}, 1fr)` }}>
        {options.map((o) => (
          <button
            key={o.value}
            type="button"
            onClick={() => onChange(o.value)}
            aria-pressed={value === o.value}
            className={cn(
              'font-ui h-10 rounded-[calc(var(--r-md)-4px)] text-[15px] font-bold transition-colors',
              value === o.value ? 'bg-[#EDFF00] text-black' : 'text-fg hover:bg-panel'
            )}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export function GridModule() {
  const [params, setParams] = useSearchParams();
  const format = (params.get('format') as GridFormat) in FORMATS ? (params.get('format') as GridFormat) : 'x';
  const theme: GridTheme = params.get('theme') === 'acid' ? 'acid' : 'dark';
  const title = (params.get('title') ?? DEFAULT_TITLE).slice(0, 24);
  const idsParam = params.get('ids') ?? '';
  const seedParam = Number(params.get('seed'));
  const seed = Number.isFinite(seedParam) && seedParam > 0 ? seedParam : 0;

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const runRef = useRef(0);
  // Estado derivado de la clave del grid: sin setState síncrono dentro del efecto.
  const key = `${format}|${theme}|${title}|${seed}|${idsParam}`;
  const [doneKey, setDoneKey] = useState('');
  const [errorKey, setErrorKey] = useState('');
  const error = errorKey === key ? 'Could not load the ZEROs. Try again.' : null;
  const busy = doneKey !== key && !error;
  const [usedIds, setUsedIds] = useState<number[]>([]);
  const [titleDraft, setTitleDraft] = useState(title);
  const [idsDraft, setIdsDraft] = useState(idsParam);

  const update = useCallback(
    (patch: Record<string, string | null>) => {
      setParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          for (const [k, v] of Object.entries(patch)) {
            if (v === null || v === '') next.delete(k);
            else next.set(k, v);
          }
          return next;
        },
        { replace: true }
      );
    },
    [setParams]
  );

  // Sin semilla en la URL: se crea una (así «copiar enlace» repite el grid).
  useEffect(() => {
    if (!seed) update({ seed: String(newSeed()) });
  }, [seed, update]);

  // El título se aplica al dejar de escribir.
  useEffect(() => {
    if (titleDraft === title) return;
    const t = setTimeout(() => update({ title: titleDraft }), 400);
    return () => clearTimeout(t);
  }, [titleDraft, title, update]);

  useEffect(() => {
    if (!seed || !canvasRef.current) return;
    const run = ++runRef.current;
    const stale = () => run !== runRef.current;
    const opts = { format, theme, title, seed, ids: parseIds(idsParam) };
    chooseIds(opts, stale)
      .then(async (ids) => {
        if (stale() || !canvasRef.current) return;
        await drawGrid(canvasRef.current, opts, ids);
        if (stale()) return;
        setUsedIds(ids);
        setDoneKey(key);
      })
      .catch(() => {
        if (stale()) return;
        setErrorKey(key);
      });
  }, [key, format, theme, title, seed, idsParam]);

  const fileName = `zero-grid-${format}-${seed}.png`;
  const toBlob = () =>
    new Promise<Blob | null>((resolve) => canvasRef.current?.toBlob(resolve, 'image/png') ?? resolve(null));

  const download = async () => {
    const blob = await toBlob();
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 5000);
  };

  const canShareFiles =
    typeof navigator !== 'undefined' &&
    typeof navigator.canShare === 'function' &&
    navigator.canShare({ files: [new File([new Blob()], 'x.png', { type: 'image/png' })] });

  const share = async () => {
    const blob = await toBlob();
    if (!blob) return;
    try {
      await navigator.share({ files: [new File([blob], fileName, { type: 'image/png' })] });
    } catch {
      /* cancelado */
    }
  };

  const f = FORMATS[format];

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-5 px-4 py-6">
      <header className="flex flex-col gap-1">
        <h1 className="font-ui text-2xl font-bold text-[#EDFF00]">ZERO Grid</h1>
        <p className="text-sm text-mute">
          Random grid of dressed ZEROs, ready to post. Hit <b>Shuffle</b> for a new mix.
        </p>
      </header>

      <div className="relative overflow-hidden rounded-[var(--r-md)] border-2 border-line bg-black">
        <canvas
          ref={canvasRef}
          width={f.w}
          height={f.h}
          className={cn('block h-auto w-full transition-opacity', busy && 'opacity-40')}
          style={{ aspectRatio: `${f.w} / ${f.h}` }}
          aria-label="ZERO grid preview"
        />
        {busy && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="font-ui animate-pulse rounded bg-black/70 px-3 py-1.5 text-sm text-[#EDFF00]">Loading ZEROs…</span>
          </div>
        )}
        {error && (
          <div className="absolute inset-0 flex items-center justify-center p-4 text-center">
            <span className="font-ui rounded bg-black/80 px-3 py-2 text-sm text-fg">{error}</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        <Button
          size="lg"
          onClick={() => {
            if (idsParam) setIdsDraft('');
            update({ seed: String(newSeed()), ids: null });
          }}
          disabled={busy}
          className="!bg-[#EDFF00] !text-black !shadow-none"
        >
          Shuffle
        </Button>
        <Button size="lg" variant="secondary" onClick={download} disabled={busy || !!error}>
          Download PNG
        </Button>
        {canShareFiles && (
          <Button size="lg" variant="secondary" onClick={share} disabled={busy || !!error} className="col-span-2 sm:col-span-1">
            Share
          </Button>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Segmented
          label="Format"
          value={format}
          onChange={(v) => update({ format: v })}
          options={[
            { value: 'x', label: 'X' },
            { value: 'square', label: 'Square' },
            { value: 'portrait', label: 'Portrait' },
          ]}
        />
        <Segmented
          label="Theme"
          value={theme}
          onChange={(v) => update({ theme: v === 'dark' ? null : v })}
          options={[
            { value: 'dark', label: 'Dark' },
            { value: 'acid', label: 'Acid' },
          ]}
        />
        <label className="flex flex-col gap-1.5">
          <span className="font-ui text-xs uppercase tracking-wider text-mute">Title</span>
          <input
            value={titleDraft}
            maxLength={24}
            onChange={(e) => setTitleDraft(e.target.value)}
            placeholder="(no title)"
            className="font-ui h-11 rounded-[var(--r-md)] border-2 border-line bg-transparent px-3 text-[16px] uppercase text-fg outline-none focus:border-[#EDFF00]"
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="font-ui text-xs uppercase tracking-wider text-mute">Specific IDs (optional)</span>
          <input
            value={idsDraft}
            inputMode="numeric"
            onChange={(e) => setIdsDraft(e.target.value)}
            onBlur={() => update({ ids: parseIds(idsDraft).join(',') || null })}
            onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
            placeholder={`e.g. 12, 57, 300-305 (max ${MAX_TOKENS})`}
            className="font-ui h-11 rounded-[var(--r-md)] border-2 border-line bg-transparent px-3 text-[16px] text-fg outline-none focus:border-[#EDFF00]"
          />
        </label>
      </div>

      <p className="text-xs text-mute">
        {f.w}×{f.h} · {f.cols}×{f.rows}
        {usedIds.length > 0 && <> · ZEROs: {usedIds.map((id) => `#${id}`).join(' ')}</>}
      </p>
    </div>
  );
}
