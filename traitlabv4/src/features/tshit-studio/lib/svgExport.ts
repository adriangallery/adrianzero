/**
 * Convert the user's pixel buffer + the T-shirt template SVG into a single
 * standalone SVG suitable for upload + on-chain reference.
 *
 * Output spec:
 *  - Single <svg> root, viewBox 0 0 148 148
 *  - First layer: the T-shirt template (raw markup, fetched at build/load time)
 *  - Second layer: a <g> with one <rect width="1" height="1"> per painted pixel
 *  - shape-rendering="crispEdges" so it stays pixel-perfect on the renderer
 *
 * The SVG is intentionally simple and human-readable. AdrianLAB's renderer
 * already loads SVGs via Resvg and rasterises to PNG, so we don't need any
 * fancy <use> / <pattern> tricks.
 */
import type { Pixel } from '../types/tshit.types';
import { CANVAS_WIDTH, CANVAS_HEIGHT } from './tshirtMask';

interface BuildArgs {
  pixels: Pixel[];
  /** Full markup of the T-shirt template (already fetched). */
  tshirtSvg: string;
  /** Optional title metadata embedded as <title>; falls back to "T-Shit". */
  title?: string;
}

/**
 * Strip the outer <svg ...> wrapper from a self-contained SVG so the inner
 * <rect>s can be inlined into our composite output.
 */
function extractInner(svgMarkup: string): string {
  const openMatch = svgMarkup.match(/<svg\b[^>]*>/i);
  if (!openMatch) return svgMarkup;
  const start = openMatch.index! + openMatch[0].length;
  const end = svgMarkup.lastIndexOf('</svg>');
  if (end < 0) return svgMarkup.slice(start);
  return svgMarkup.slice(start, end);
}

export function buildDesignSvg({ pixels, tshirtSvg, title }: BuildArgs): string {
  const inner = extractInner(tshirtSvg).trim();

  // Group identical-color runs to keep the SVG compact. Sort by color first,
  // then merge horizontally adjacent same-color cells in the same row.
  const buckets = new Map<string, Pixel[]>();
  for (const p of pixels) {
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
    `<g id="tshirt-base">${inner}</g>`,
    `<g id="design">${rectsByColor.join('')}</g>`,
    '</svg>',
  ].join('');
}

function escapeXml(s: string): string {
  return s.replace(/[<>&"']/g, c =>
    ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&apos;' }[c]!)
  );
}
