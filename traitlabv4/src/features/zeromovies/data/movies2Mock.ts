import type { Movie2 } from '../types';

/**
 * ZEROmovies S2 — "Return of the Pixel"
 *
 * 24 movies, IDs 27-50. Catalog mirrors `AdrianLAB/public/labmetadata/zeromovies2metadata.json`
 * exactly so the renderer reads the same names this UI displays. The shape mirrors the
 * on-chain `Movie2` returned by `getMovie2(movieId)` so swapping to the real
 * hook is a one-line change.
 *
 * Two movies are reserved off the public shelf:
 *   - #42 Major Dutch Schaefer  → pre-launch auction (animated GIF)
 *   - #28 Bruce Lee             → Premiere Budokai prize
 */
export const MOVIES_S2_MOCK: Movie2[] = [
  { id: 27, name: 'Leeloo',                angle: 'pixel',  isMystery: false, revealed: true },
  { id: 28, name: 'Bruce Lee',             angle: 'cult',   isMystery: false, revealed: true, reservedFor: 'budokai' },
  { id: 29, name: 'Cruella',               angle: 'horror', isMystery: false, revealed: true },
  { id: 30, name: 'Donatello',             angle: 'pixel',  isMystery: true,  revealed: false },
  { id: 31, name: 'Ivan Drago',            angle: 'horror', isMystery: true,  revealed: false },
  { id: 32, name: 'Elwood Blues',          angle: 'cult',   isMystery: true,  revealed: false },
  { id: 33, name: 'Harley Quinn',          angle: 'horror', isMystery: true,  revealed: false },
  { id: 34, name: 'Holly Golightly',       angle: 'cult',   isMystery: true,  revealed: false },
  { id: 35, name: 'Indiana Jones',         angle: 'cult',   isMystery: false, revealed: true },
  { id: 36, name: 'Jake Blues',            angle: 'cult',   isMystery: true,  revealed: false },
  { id: 37, name: 'John Rambo',            angle: 'horror', isMystery: false, revealed: true },
  { id: 38, name: 'Joker',                 angle: 'horror', isMystery: true,  revealed: false },
  { id: 39, name: 'The Bride',             angle: 'horror', isMystery: true,  revealed: false },
  { id: 40, name: 'Lara Croft',            angle: 'pixel',  isMystery: false, revealed: true },
  { id: 41, name: 'Luke, C-3PO & R2-D2',   angle: 'pixel',  isMystery: true,  revealed: false },
  { id: 42, name: 'Major Dutch Schaefer',  angle: 'pixel',  isMystery: false, revealed: true,  reservedFor: 'auction', hasAnimation: true },
  { id: 43, name: 'Maverick',              angle: 'cult',   isMystery: false, revealed: true },
  { id: 44, name: 'Michelangelo',          angle: 'pixel',  isMystery: false, revealed: true },
  { id: 45, name: 'Obi-Wan Kenobi',        angle: 'pixel',  isMystery: false, revealed: true },
  { id: 46, name: 'The Predator',          angle: 'horror', isMystery: true,  revealed: false },
  { id: 47, name: 'Rocky Balboa',          angle: 'cult',   isMystery: false, revealed: true },
  { id: 48, name: 'Spider-Man',            angle: 'pixel',  isMystery: false, revealed: true },
  { id: 49, name: 'Superman',              angle: 'pixel',  isMystery: false, revealed: true },
  { id: 50, name: 'Topper Harley',         angle: 'cult',   isMystery: true,  revealed: false },
];

/**
 * Resolve cover URL. Animated movies use the GIF; everything else uses the
 * AdrianLAB pixel SVG. AdrianLAB is the source of truth — same path the
 * compositor reads, so what you see here matches the on-chain render.
 */
export function getS2PosterUrl(movieId: number, isMystery: boolean): string {
  if (isMystery) return '/images/zeromovies2/_mystery.svg';
  const m = MOVIES_S2_MOCK.find((x) => x.id === movieId);
  const base = 'https://adrianlab.vercel.app/labimages/zeromovies2';
  if (m?.hasAnimation) return `${base}/animated/${movieId}.gif`;
  return `${base}/${movieId}.svg`;
}

/**
 * Mock rental state per movieId. Default = on shelf, no renter. Only seeded
 * with a handful of demo states so the UI can be exercised without on-chain
 * data. Swapped for live `getMovie2RentalInfo` reads once S2 ships.
 */
export const MOVIES_S2_RENTAL_MOCK: Record<number, {
  permanent: boolean;
  renter: string;
  rentedAt: number;
  isOverdue: boolean;
  daysOverdue: number;
}> = {};
