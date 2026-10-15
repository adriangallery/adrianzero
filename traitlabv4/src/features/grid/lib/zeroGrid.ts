/**
 * Grid de ZERO para redes (15-oct-2026): versión de navegador del generador
 * `AdrianLAB/scripts/zero-grid/zero-grid.mjs`. Misma maquetación, paleta
 * (negro + amarillo ácido #EDFF00), logo y fuente ADRIAN_ZERO, pero dibujado en
 * un <canvas> con los renders públicos de lab.adrianzero.com (CORS abierto para
 * adrianzero.com). Sin claves, sin servidor propio, nada on-chain salvo una
 * lectura de `totalSupply` por RPC público.
 */

export const LAB_BASE = 'https://lab.adrianzero.com';
const CORE = '0x6E369BF0E4e0c106192D606FB6d85836d684DA75'; // AdrianLabCore (Base)
const PUBLIC_RPC = 'https://mainnet.base.org';

/** Tope de ZEROs por grid (no saturar el render de AdrianLAB). */
export const MAX_TOKENS = 36;

export type GridFormat = 'x' | 'square' | 'portrait';
export type GridTheme = 'dark' | 'acid';

const C = { acid: '#EDFF00', black: '#000000', grayDark: '#333333' };
const THEMES: Record<GridTheme, { bg: string; text: string; logoTile: string; logoInk: string }> = {
  dark: { bg: C.black, text: C.acid, logoTile: C.acid, logoInk: C.black },
  acid: { bg: C.acid, text: C.black, logoTile: C.black, logoInk: C.acid },
};

export const FORMATS: Record<GridFormat, { w: number; h: number; cols: number; rows: number; logos: number; label: string }> = {
  x: { w: 1200, h: 675, cols: 6, rows: 3, logos: 2, label: 'X 16:9' },
  square: { w: 1080, h: 1080, cols: 4, rows: 4, logos: 3, label: 'Square' },
  portrait: { w: 1080, h: 1350, cols: 4, rows: 5, logos: 3, label: 'Portrait' },
};

// ---------- logo [ZERO] como trazos (sin <img> SVG: no ensucia el canvas en Safari) ----------
const WM_X0 = 413.07;
const WM_W = 691.03 - 413.07;
const WM_H = 99.21;
const rect = (x: number, y: number, w: number, h: number) => `M${x} ${y}h${w}v${h}h${-w}Z`;
const poly = (pts: string) => {
  const n = pts.trim().split(/\s+/).map(Number);
  let d = `M${n[0]} ${n[1]}`;
  for (let i = 2; i < n.length; i += 2) d += `L${n[i]} ${n[i + 1]}`;
  return `${d}Z`;
};
const WORDMARK_PATHS = [
  rect(583.14, 56.69, 14.17, 28.35),
  poly('483.93 14.17 469.76 14.17 469.76 0 455.59 0 455.59 14.17 441.41 14.17 441.41 28.35 469.76 28.35 469.76 42.52 483.93 42.52 483.93 28.35 483.93 28.35 483.93 14.17'),
  poly('483.93 70.87 455.59 70.87 455.59 56.69 441.41 56.69 441.41 70.87 441.41 70.87 441.41 85.04 455.59 85.04 455.59 99.21 469.76 99.21 469.76 85.04 483.93 85.04 483.93 70.87'),
  rect(498.11, 14.17, 42.52, 14.17),
  rect(498.11, 42.52, 42.52, 14.17),
  poly('583.14 14.17 568.97 14.17 554.8 14.17 554.8 28.35 554.8 42.52 554.8 56.69 554.8 85.04 568.97 85.04 568.97 56.69 583.14 56.69 583.14 42.52 568.97 42.52 568.97 28.35 583.14 28.35 583.14 42.52 597.32 42.52 597.32 28.35 597.32 14.17 583.14 14.17'),
  'M639.84,14.17h-28.35v70.87h42.52V14.17h-14.17ZM639.84,56.69v14.17h-14.17V28.35h14.17v28.35Z',
  rect(498.11, 70.87, 42.52, 14.17),
  poly('441.41 14.17 441.41 0 427.24 0 421.68 0 413.07 0 413.07 99.21 425.49 99.21 427.24 99.21 441.41 99.21 441.41 85.04 427.24 85.04 427.24 14.17 441.41 14.17'),
  rect(455.59, 42.52, 14.17, 14.17),
  poly('681.45 0 676.86 0 662.68 0 662.68 14.17 676.86 14.17 676.86 85.04 662.68 85.04 662.68 99.21 676.86 99.21 681.45 99.21 691.03 99.21 691.03 0 681.45 0'),
];

function drawWordmark(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, color: string) {
  const s = width / WM_W;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  ctx.translate(-WM_X0, 0);
  ctx.fillStyle = color;
  for (const d of WORDMARK_PATHS) ctx.fill(new Path2D(d));
  ctx.restore();
  return { w: width, h: WM_H * s };
}

// ---------- utilidades ----------
export function mulberry32(seed: number) {
  let t = seed >>> 0;
  return () => {
    t = (t + 0x6d2b79f5) >>> 0;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r;
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffle<T>(arr: T[], rnd: () => number): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** «12, 57, 300-305» → [12, 57, 300…305], sin repetidos y con tope. */
export function parseIds(s: string): number[] {
  const out: number[] = [];
  for (const part of s.split(/[\s,;]+/).filter(Boolean)) {
    const m = part.match(/^(\d+)-(\d+)$/);
    if (m) {
      const a = +m[1];
      const b = Math.min(+m[2], a + MAX_TOKENS);
      for (let i = a; i <= b; i++) out.push(i);
    } else if (/^\d+$/.test(part)) out.push(+part);
    if (out.length >= MAX_TOKENS) break;
  }
  return [...new Set(out)].filter((n) => n > 0).slice(0, MAX_TOKENS);
}

function logoPositions(cols: number, rows: number, n: number, rnd: () => number) {
  const cells = shuffle([...Array(cols * rows).keys()], rnd);
  const chosen: number[] = [];
  const touches = (a: number, b: number) =>
    Math.abs((a % cols) - (b % cols)) + Math.abs(Math.floor(a / cols) - Math.floor(b / cols)) <= 1;
  for (const c of cells) if (chosen.length < n && !chosen.some((x) => touches(x, c))) chosen.push(c);
  for (const c of cells) if (chosen.length < n && !chosen.includes(c)) chosen.push(c);
  return new Set(chosen);
}

// ---------- datos (con caché en memoria) ----------
let supplyPromise: Promise<number> | null = null;
export function totalSupply(): Promise<number> {
  if (!supplyPromise) {
    supplyPromise = fetch(PUBLIC_RPC, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'eth_call', params: [{ to: CORE, data: '0x18160ddd' }, 'latest'] }),
    })
      .then((r) => r.json())
      .then((j) => {
        const n = parseInt(j?.result, 16);
        if (!Number.isFinite(n) || n <= 1) throw new Error('totalSupply');
        return n;
      })
      .catch((e) => {
        supplyPromise = null;
        throw e;
      });
  }
  return supplyPromise;
}

// Un ZERO «vestido» tiene algún trait más allá de los de base.
const BASE_TRAITS = /^(Generation|DupGeneration|Skin|Mutation Level|Mutation Type|Mutation Stage|UsedSerum)$/;
const dressedCache = new Map<number, Promise<boolean>>();
function isDressed(id: number): Promise<boolean> {
  let p = dressedCache.get(id);
  if (!p) {
    p = fetch(`${LAB_BASE}/api/metadata/${id}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((m) => !!m && (m.attributes || []).some((t: { trait_type?: string }) => !BASE_TRAITS.test(String(t.trait_type))))
      .catch(() => false);
    dressedCache.set(id, p);
  }
  return p;
}

async function pickDressed(candidates: number[], n: number, isStale: () => boolean) {
  const out: number[] = [];
  for (let i = 0; i < candidates.length && out.length < n && i < 400; i += 8) {
    if (isStale()) break;
    const batch = candidates.slice(i, i + 8);
    const ok = await Promise.all(batch.map(isDressed));
    batch.forEach((id, j) => ok[j] && out.push(id));
  }
  return out.slice(0, n);
}

const imgCache = new Map<number, Promise<HTMLImageElement | null>>();
function loadRender(id: number): Promise<HTMLImageElement | null> {
  let p = imgCache.get(id);
  if (!p) {
    const once = () =>
      new Promise<HTMLImageElement>((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.decoding = 'async';
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error(`render ${id}`));
        img.src = `${LAB_BASE}/api/render/${id}`;
      });
    p = once()
      .catch(() => new Promise<void>((r) => setTimeout(r, 1500)).then(once))
      .catch(() => {
        imgCache.delete(id);
        return null;
      });
    imgCache.set(id, p);
  }
  return p;
}

// Fuente ADRIAN_ZERO registrada a mano (la hoja global no siempre la declara).
const FONT_NAME = 'ZeroGridFont';
let fontPromise: Promise<string> | null = null;
function loadFont(): Promise<string> {
  if (!fontPromise) {
    fontPromise = new FontFace(FONT_NAME, 'url(/fonts/ADRIAN_ZERO.otf)')
      .load()
      .then((face) => {
        document.fonts.add(face);
        return `"${FONT_NAME}"`;
      })
      .catch(() => {
        fontPromise = null;
        return 'monospace';
      });
  }
  return fontPromise;
}

export interface GridOptions {
  format: GridFormat;
  theme: GridTheme;
  title: string;
  seed: number;
  ids?: number[];
}

/** Elige los IDs del grid (los indicados o aleatorios «vestidos» según la semilla). */
export async function chooseIds(o: GridOptions, isStale: () => boolean = () => false): Promise<number[]> {
  const f = FORMATS[o.format];
  const cells = f.cols * f.rows;
  if (o.ids && o.ids.length) return o.ids.slice(0, Math.min(cells - 1, MAX_TOKENS));
  const nTokens = cells - f.logos;
  const supply = await totalSupply();
  const all = Array.from({ length: supply - 1 }, (_, i) => i + 2); // #1 = token de prueba
  return pickDressed(shuffle(all, mulberry32(o.seed)), nTokens, isStale);
}

/** Dibuja el grid completo en el canvas (lo redimensiona al formato). */
export async function drawGrid(canvas: HTMLCanvasElement, o: GridOptions, ids: number[]) {
  const f = FORMATS[o.format];
  const th = THEMES[o.theme];
  const { w: W, h: H, cols, rows } = f;
  const cellsTotal = cols * rows;
  const rnd = mulberry32(o.seed ^ 0x9e3779b9);

  const fontFamily = await loadFont();
  const renders = await Promise.all(ids.map(loadRender));

  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('canvas');
  ctx.imageSmoothingEnabled = false;
  ctx.fillStyle = th.bg;
  ctx.fillRect(0, 0, W, H);

  const title = o.title.trim().toUpperCase();
  const pad = Math.round(Math.min(W, H) * 0.045);
  const hasHeader = o.format !== 'square' || !!title;
  const headerH = hasHeader ? Math.round(H * (o.format === 'x' ? 0.14 : 0.13)) : 0;
  const availW = W - 2 * pad;
  const availH = H - 2 * pad - headerH;
  const gapRatio = 0.045;
  const tile = Math.floor(Math.min(availW / (cols + (cols - 1) * gapRatio), availH / (rows + (rows - 1) * gapRatio)));
  const gap = Math.max(4, Math.round(tile * gapRatio));
  const gridW = cols * tile + (cols - 1) * gap;
  const gridH = rows * tile + (rows - 1) * gap;
  const gx = Math.round((W - gridW) / 2);
  const gy = pad + headerH + Math.round((availH - gridH) / 2);

  // Cabecera: logo a la izquierda y título a la derecha (o logo centrado sin título)
  if (hasHeader) {
    const wmW = Math.round(headerH * 0.62 * (WM_W / WM_H));
    const wmH = (WM_H * wmW) / WM_W;
    const hy = pad + Math.round((headerH - wmH) / 2) - Math.round(headerH * 0.08);
    if (title) {
      drawWordmark(ctx, gx, hy, wmW, th.text);
      const maxWidth = gridW - wmW - pad;
      let size = Math.round(headerH * 0.5);
      ctx.font = `${size}px ${fontFamily}, monospace`;
      while (size > 12 && ctx.measureText(title).width > maxWidth) {
        size -= 2;
        ctx.font = `${size}px ${fontFamily}, monospace`;
      }
      const m = ctx.measureText(title);
      const asc = m.actualBoundingBoxAscent || size * 0.7;
      const desc = m.actualBoundingBoxDescent || 0;
      ctx.fillStyle = th.text;
      ctx.textAlign = 'right';
      ctx.textBaseline = 'alphabetic';
      ctx.fillText(title, gx + gridW, hy + wmH / 2 + (asc - desc) / 2);
    } else {
      drawWordmark(ctx, Math.round((W - wmW) / 2), hy, wmW, th.text);
    }
  }

  // Casillas (las que fallen al cargar quedan como casilla de logo)
  const logos = logoPositions(cols, rows, cellsTotal - ids.length, rnd);
  const radius = Math.round(tile * 0.09);
  ctx.save();
  ctx.beginPath();
  if (typeof ctx.roundRect === 'function') ctx.roundRect(gx, gy, gridW, gridH, radius);
  else ctx.rect(gx, gy, gridW, gridH);
  ctx.clip();
  let k = 0;
  for (let i = 0; i < cellsTotal; i++) {
    const x = gx + (i % cols) * (tile + gap);
    const y = gy + Math.floor(i / cols) * (tile + gap);
    const img = logos.has(i) ? null : renders[k++];
    if (img) {
      ctx.drawImage(img, x, y, tile, tile);
    } else {
      ctx.fillStyle = th.logoTile;
      ctx.fillRect(x, y, tile, tile);
      const lw = tile * 0.62;
      const lh = (WM_H * lw) / WM_W;
      drawWordmark(ctx, x + (tile - lw) / 2, y + (tile - lh) / 2, lw, th.logoInk);
    }
  }
  ctx.restore();
}
