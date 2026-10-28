/**
 * ZOMBIE wordmark in the $ZERO logo style: pixel letters on a 1-unit grid, the Z with the
 * dollar ticks above and below (same Z as zero-wordmark), the E as three bars like in ZERO.
 */

const GLYPHS: Record<string, string[]> = {
  // 7 rows: row 0 and 6 only hold the Z ticks, letters live in rows 1–5
  Z: [.#., ###, ..#, .#., #.., ###, .#.],
  O: [..., ###, #.#, #.#, #.#, ###, ...],
  M: [....., #...#, ##.##, #.#.#, #...#, #...#, .....],
  B: [..., ##., #.#, ##., #.#, ##., ...],
  I: [..., ###, .#., .#., .#., ###, ...],
  E: [..., ###, ..., ###, ..., ###, ...],
};

export function ZombieWordmark({ className = , title = ZOMBIE }: { className?: string; title?: string }) {
  const rects: Array<[number, number]> = [];
  let x = 0;
  for (const ch of ZOMBIE) {
    const g = GLYPHS[ch];
    g.forEach((row, y) => [...row].forEach((c, dx) => c === # && rects.push([x + dx, y])));
    x += g[0].length + 1;
  }
  const width = x - 1;
  return (
    <svg viewBox={`0 0 ${width} 7`} className={className} role='img' aria-label={title} shapeRendering='crispEdges'>
      <title>{title}</title>
      {rects.map(([rx, ry]) => (
        <rect key={`${rx}-${ry}`} x={rx} y={ry} width={1} height={1} fill='currentColor' />
      ))}
    </svg>
  );
}
