import type { Movie2 } from '../types';

/**
 * Placeholder S2 catalog while the artist finalises art.
 * 26 movies, mix of three angles: 90s/2000s cult, videogame-as-movie, horror.
 * ~30% are mystery cards (revealed only after first interaction).
 *
 * Final names + cover art replace this when delivered. The shape mirrors the
 * on-chain `Movie2` returned by `getMovie2(movieId)` so swapping to the real
 * hook is a one-line change.
 */
export const MOVIES_S2_MOCK: Movie2[] = [
  // 90s/2000s cult (8)
  { id: 1,  name: 'Tyler Durden',         angle: 'cult',   isMystery: false },
  { id: 2,  name: 'The Dude',             angle: 'cult',   isMystery: false },
  { id: 3,  name: '???',                  angle: 'cult',   isMystery: true  },
  { id: 4,  name: 'Jack Sparrow',         angle: 'cult',   isMystery: false },
  { id: 5,  name: 'Shrek',                angle: 'cult',   isMystery: false },
  { id: 6,  name: 'Neo (The One)',        angle: 'cult',   isMystery: false },
  { id: 7,  name: '???',                  angle: 'cult',   isMystery: true  },
  { id: 8,  name: 'Smith',                angle: 'cult',   isMystery: false },
  // Videogame-as-movie (8)
  { id: 9,  name: 'Lara Croft',           angle: 'pixel',  isMystery: false },
  { id: 10, name: 'Mario',                angle: 'pixel',  isMystery: false },
  { id: 11, name: '???',                  angle: 'pixel',  isMystery: true  },
  { id: 12, name: 'Sonic',                angle: 'pixel',  isMystery: false },
  { id: 13, name: 'Master Chief',         angle: 'pixel',  isMystery: false },
  { id: 14, name: '???',                  angle: 'pixel',  isMystery: true  },
  { id: 15, name: 'Solid Snake',          angle: 'pixel',  isMystery: false },
  { id: 16, name: 'Pac-Man',              angle: 'pixel',  isMystery: false },
  // Horror legends (10)
  { id: 17, name: 'Freddy',               angle: 'horror', isMystery: false },
  { id: 18, name: 'Jason',                angle: 'horror', isMystery: false },
  { id: 19, name: '???',                  angle: 'horror', isMystery: true  },
  { id: 20, name: 'Pennywise',            angle: 'horror', isMystery: false },
  { id: 21, name: 'Alien',                angle: 'horror', isMystery: false },
  { id: 22, name: '???',                  angle: 'horror', isMystery: true  },
  { id: 23, name: 'Ghostface',            angle: 'horror', isMystery: false },
  { id: 24, name: 'Michael Myers',        angle: 'horror', isMystery: false },
  { id: 25, name: '???',                  angle: 'horror', isMystery: true  },
  { id: 26, name: 'Chucky',               angle: 'horror', isMystery: false },
];

/** mock placeholder image (until artist delivers covers) */
export function getS2PosterUrl(movieId: number, isMystery: boolean): string {
  if (isMystery) return '/images/zeromovies2/_mystery.svg';
  return `/images/zeromovies2/${movieId}.png`;
}

/** Mock rental state per movieId — start everything available, randomise a few */
export const MOVIES_S2_RENTAL_MOCK: Record<number, {
  permanent: boolean;
  renter: string;
  rentedAt: number;
  isOverdue: boolean;
  daysOverdue: number;
}> = {
  // movie 1 — rented by 0xCAFE 3 days ago, not overdue yet
  1: {
    permanent: false,
    renter: '0x000000000000000000000000000000000000cafe',
    rentedAt: Math.floor(Date.now() / 1000) - 3 * 86_400,
    isOverdue: false,
    daysOverdue: 0,
  },
  // movie 5 — rented 12 days ago, overdue 5 days
  5: {
    permanent: false,
    renter: '0x00000000000000000000000000000000c0ffee00',
    rentedAt: Math.floor(Date.now() / 1000) - 12 * 86_400,
    isOverdue: true,
    daysOverdue: 5,
  },
  // movie 10 — bought permanently
  10: {
    permanent: true,
    renter: '0x000000000000000000000000000000000000beef',
    rentedAt: Math.floor(Date.now() / 1000) - 1 * 86_400,
    isOverdue: false,
    daysOverdue: 0,
  },
};
