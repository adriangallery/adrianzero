/**
 * Convert the user's pixel buffer + the T-shirt template into a single
 * standalone SVG suitable for upload + on-chain reference.
 *
 * Output spec:
 *  - Single <svg> root, viewBox 0 0 148 148
 *  - First layer: the T-shirt template, embedded as a base64 PNG via <image>
 *    (the original 2860-rect SVG is ~140KB; the rasterised PNG is ~1.4KB →
 *    keeps us under the 64KB upload cap)
 *  - Second layer: a <g> with one <rect width="N" height="1"> per painted run
 *  - shape-rendering="crispEdges" so it stays pixel-perfect on the renderer
 */
import type { Pixel } from '../types/tshit.types';
import { CANVAS_WIDTH, CANVAS_HEIGHT, shadedAt } from './tshirtMask';
import templatePng from '../data/tshirt-template-png.json';

interface BuildArgs {
  pixels: Pixel[];
  /**
   * Full markup of the T-shirt template (kept for backwards compatibility
   * with callers that already fetched it). No longer used internally — the
   * template is shipped as a baked PNG inside the bundle.
   */
  tshirtSvg?: string;
  /** Optional title metadata embedded as <title>; falls back to "T-Shit". */
  title?: string;
}

const TEMPLATE_DATA_URI = `data:image/png;base64,${(templatePng as { b64: string }).b64}`;

export function buildDesignSvg({ pixels, title }: BuildArgs): string {

  // Bake the t-shirt's per-cell luminance into each painted pixel so the
  // exported SVG carries the same shading the user sees in the editor. The
  // original (unshaded) color is still recoverable via Pick because the
  // store keeps it; only the rendered output applies the multiply.
  const shadedPixels: Pixel[] = pixels.map(p => ({
    x: p.x,
    y: p.y,
    color: shadedAt(p.x, p.y, p.color),
  }));

  // Group identical-color runs to keep the SVG compact. Sort by color first,
  // then merge horizontally adjacent same-color cells in the same row.
  const buckets = new Map<string, Pixel[]>();
  for (const p of shadedPixels) {
    let arr = buckets.get(p.color);
    if (!arr) buckets.set(p.color, (arr = []));
    arr.push(p);
  }

  const rectsByColor: string[] = [];
  for (const [color, ps] of buckets) {
    ps.sort((a, b) => (a.y - b.y) || (a.x - b.x));
    let i = 0;
    const parts: string[] = [];
    while (i < ps.length) {
      const start = ps[i];
      let len = 1;
      while (
        i + len < ps.length &&
        ps[i + len].y === start.y &&
        ps[i + len].x === start.x + len
      ) {
        len++;
      }
      parts.push(
        `<rect x="${start.x}" y="${start.y}" width="${len}" height="1"/>`
      );
      i += len;
    }
    rectsByColor.push(`<g fill="${color}">${parts.join('')}</g>`);
  }

  const titleEl = title
    ? `<title>${escapeXml(title)}</title>`
    : '<title>T-Shit</title>';

  return [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${CANVAS_WIDTH} ${CANVAS_HEIGHT}" width="${CANVAS_WIDTH}" height="${CANVAS_HEIGHT}" shape-rendering="crispEdges">`,
    titleEl,
    `<image x="0" y="0" width="${CANVAS_WIDTH}" height="${CANVAS_HEIGHT}" href="${TEMPLATE_DATA_URI}" image-rendering="pixelated"/>`,
    `<g id="design">${rectsByColor.join('')}</g>`,
    '</svg>',
  ].join('');
}

function escapeXml(s: string): string {
  return s.replace(/[<>&"']/g, c =>
    ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&apos;' }[c]!)
  );
}
