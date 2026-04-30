/**
 * 5x7 pixel font for T-Shit Studio.
 *
 * Each glyph is a 7-row × 5-column bitmap. '#' = lit pixel, '.' = empty.
 * Hand-authored to keep the SVG output tiny and the rendering deterministic.
 * Coverage: A-Z, 0-9, space, '.', '!', '?', '-', "'", ':', '/', '#', '$'.
 *
 * Caller stamps glyph at (cx, cy) with active color, optional scale 1x/2x/3x.
 */

export const GLYPH_WIDTH = 5;
export const GLYPH_HEIGHT = 7;
export const GLYPH_SPACING = 1; // empty column between glyphs

type Glyph = string[]; // 7 strings of length 5

const G: Record<string, Glyph> = {
  ' ': [
    '.....',
    '.....',
    '.....',
    '.....',
    '.....',
    '.....',
    '.....',
  ],
  '!': [
    '..#..',
    '..#..',
    '..#..',
    '..#..',
    '..#..',
    '.....',
    '..#..',
  ],
  "'": [
    '..#..',
    '..#..',
    '.....',
    '.....',
    '.....',
    '.....',
    '.....',
  ],
  '#': [
    '.#.#.',
    '#####',
    '.#.#.',
    '#####',
    '.#.#.',
    '.....',
    '.....',
  ],
  '$': [
    '..#..',
    '.####',
    '#.#..',
    '.###.',
    '..#.#',
    '####.',
    '..#..',
  ],
  '-': [
    '.....',
    '.....',
    '.....',
    '#####',
    '.....',
    '.....',
    '.....',
  ],
  '.': [
    '.....',
    '.....',
    '.....',
    '.....',
    '.....',
    '.....',
    '..#..',
  ],
  '/': [
    '....#',
    '....#',
    '...#.',
    '..#..',
    '.#...',
    '#....',
    '#....',
  ],
  ':': [
    '.....',
    '..#..',
    '.....',
    '.....',
    '.....',
    '..#..',
    '.....',
  ],
  '?': [
    '.###.',
    '#...#',
    '....#',
    '...#.',
    '..#..',
    '.....',
    '..#..',
  ],

  '0': [
    '.###.',
    '#...#',
    '#..##',
    '#.#.#',
    '##..#',
    '#...#',
    '.###.',
  ],
  '1': [
    '..#..',
    '.##..',
    '..#..',
    '..#..',
    '..#..',
    '..#..',
    '.###.',
  ],
  '2': [
    '.###.',
    '#...#',
    '....#',
    '...#.',
    '..#..',
    '.#...',
    '#####',
  ],
  '3': [
    '.###.',
    '#...#',
    '....#',
    '..##.',
    '....#',
    '#...#',
    '.###.',
  ],
  '4': [
    '...#.',
    '..##.',
    '.#.#.',
    '#..#.',
    '#####',
    '...#.',
    '...#.',
  ],
  '5': [
    '#####',
    '#....',
    '####.',
    '....#',
    '....#',
    '#...#',
    '.###.',
  ],
  '6': [
    '..##.',
    '.#...',
    '#....',
    '####.',
    '#...#',
    '#...#',
    '.###.',
  ],
  '7': [
    '#####',
    '....#',
    '...#.',
    '..#..',
    '.#...',
    '.#...',
    '.#...',
  ],
  '8': [
    '.###.',
    '#...#',
    '#...#',
    '.###.',
    '#...#',
    '#...#',
    '.###.',
  ],
  '9': [
    '.###.',
    '#...#',
    '#...#',
    '.####',
    '....#',
    '...#.',
    '.##..',
  ],

  A: [
    '.###.',
    '#...#',
    '#...#',
    '#####',
    '#...#',
    '#...#',
    '#...#',
  ],
  B: [
    '####.',
    '#...#',
    '#...#',
    '####.',
    '#...#',
    '#...#',
    '####.',
  ],
  C: [
    '.###.',
    '#...#',
    '#....',
    '#....',
    '#....',
    '#...#',
    '.###.',
  ],
  D: [
    '###..',
    '#..#.',
    '#...#',
    '#...#',
    '#...#',
    '#..#.',
    '###..',
  ],
  E: [
    '#####',
    '#....',
    '#....',
    '###..',
    '#....',
    '#....',
    '#####',
  ],
  F: [
    '#####',
    '#....',
    '#....',
    '###..',
    '#....',
    '#....',
    '#....',
  ],
  G: [
    '.###.',
    '#...#',
    '#....',
    '#.###',
    '#...#',
    '#...#',
    '.###.',
  ],
  H: [
    '#...#',
    '#...#',
    '#...#',
    '#####',
    '#...#',
    '#...#',
    '#...#',
  ],
  I: [
    '.###.',
    '..#..',
    '..#..',
    '..#..',
    '..#..',
    '..#..',
    '.###.',
  ],
  J: [
    '..###',
    '...#.',
    '...#.',
    '...#.',
    '...#.',
    '#..#.',
    '.##..',
  ],
  K: [
    '#...#',
    '#..#.',
    '#.#..',
    '##...',
    '#.#..',
    '#..#.',
    '#...#',
  ],
  L: [
    '#....',
    '#....',
    '#....',
    '#....',
    '#....',
    '#....',
    '#####',
  ],
  M: [
    '#...#',
    '##.##',
    '#.#.#',
    '#.#.#',
    '#...#',
    '#...#',
    '#...#',
  ],
  N: [
    '#...#',
    '##..#',
    '#.#.#',
    '#.#.#',
    '#.#.#',
    '#..##',
    '#...#',
  ],
  O: [
    '.###.',
    '#...#',
    '#...#',
    '#...#',
    '#...#',
    '#...#',
    '.###.',
  ],
  P: [
    '####.',
    '#...#',
    '#...#',
    '####.',
    '#....',
    '#....',
    '#....',
  ],
  Q: [
    '.###.',
    '#...#',
    '#...#',
    '#...#',
    '#.#.#',
    '#..#.',
    '.##.#',
  ],
  R: [
    '####.',
    '#...#',
    '#...#',
    '####.',
    '#.#..',
    '#..#.',
    '#...#',
  ],
  S: [
    '.####',
    '#....',
    '#....',
    '.###.',
    '....#',
    '....#',
    '####.',
  ],
  T: [
    '#####',
    '..#..',
    '..#..',
    '..#..',
    '..#..',
    '..#..',
    '..#..',
  ],
  U: [
    '#...#',
    '#...#',
    '#...#',
    '#...#',
    '#...#',
    '#...#',
    '.###.',
  ],
  V: [
    '#...#',
    '#...#',
    '#...#',
    '#...#',
    '#...#',
    '.#.#.',
    '..#..',
  ],
  W: [
    '#...#',
    '#...#',
    '#...#',
    '#.#.#',
    '#.#.#',
    '##.##',
    '#...#',
  ],
  X: [
    '#...#',
    '#...#',
    '.#.#.',
    '..#..',
    '.#.#.',
    '#...#',
    '#...#',
  ],
  Y: [
    '#...#',
    '#...#',
    '.#.#.',
    '..#..',
    '..#..',
    '..#..',
    '..#..',
  ],
  Z: [
    '#####',
    '....#',
    '...#.',
    '..#..',
    '.#...',
    '#....',
    '#####',
  ],
};

/**
 * Render a string into a flat pixel list (relative coords, top-left = 0,0).
 * Unknown chars render as empty space (1 column wide).
 *
 * `bold` (default true) thickens each lit pixel by stamping an extra block
 * to its right — strokes go from 1px thick to 2px thick without doubling
 * the height. Cursor advance bumps by `+1*scale` per char to avoid bleeding
 * into the next glyph's spacing column.
 */
export function renderText(text: string, scale = 1, bold = true): { x: number; y: number }[] {
  const out: { x: number; y: number }[] = [];
  if (scale < 1 || !Number.isFinite(scale)) scale = 1;
  scale = Math.floor(scale);
  const advance = (GLYPH_WIDTH + GLYPH_SPACING + (bold ? 1 : 0)) * scale;
  const boldOffset = bold ? scale : 0;

  let cursor = 0;
  for (const raw of text) {
    const ch = raw.toUpperCase();
    const glyph = G[ch];
    if (!glyph) {
      cursor += advance;
      continue;
    }
    for (let row = 0; row < GLYPH_HEIGHT; row++) {
      const line = glyph[row];
      for (let col = 0; col < GLYPH_WIDTH; col++) {
        if (line[col] !== '#') continue;
        for (let dy = 0; dy < scale; dy++) {
          for (let dx = 0; dx < scale; dx++) {
            out.push({ x: cursor + col * scale + dx, y: row * scale + dy });
            if (boldOffset) {
              out.push({ x: cursor + col * scale + dx + boldOffset, y: row * scale + dy });
            }
          }
        }
      }
    }
    cursor += advance;
  }
  return out;
}

/** Width of a rendered string in pixels at given scale (bold-aware). */
export function measureText(text: string, scale = 1, bold = true): number {
  if (text.length === 0) return 0;
  const charWidth = (GLYPH_WIDTH + (bold ? 1 : 0)) * scale;
  const totalSpacing = (text.length - 1) * GLYPH_SPACING * scale;
  return text.length * charWidth + totalSpacing;
}

/** Glyph height including bold dilation (matches what renderText emits). */
export function measureTextHeight(scale = 1, _bold = true): number {
  return GLYPH_HEIGHT * scale;
}
