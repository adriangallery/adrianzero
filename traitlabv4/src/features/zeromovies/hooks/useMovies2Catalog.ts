import { useMemo } from 'react';
import { MOVIES_S2_MOCK, MOVIES_S2_RENTAL_MOCK } from '../data/movies2Mock';
import type { Movie2, Movie2RentalState } from '../types';

const ZERO_ADDR = '0x0000000000000000000000000000000000000000';

/**
 * Mock-backed S2 catalog hook. Returns the placeholder catalog + per-movie
 * rental state until the on-chain ZEROmoviesFacet2 is deployed and the artist
 * delivers the final art. When deploy lands, swap the body to wagmi
 * `useReadContract` calls against `getAllMovie2Ids` + `getMovie2(id)` — the
 * shape of `Movie2` and `Movie2RentalState` already matches the on-chain
 * structs, so consumers don't change.
 */
export function useMovies2Catalog() {
  const movies: Movie2[] = MOVIES_S2_MOCK;

  const rentalMap = useMemo(() => {
    const map = new Map<number, Movie2RentalState>();
    for (const m of movies) {
      const r = MOVIES_S2_RENTAL_MOCK[m.id];
      map.set(
        m.id,
        r ?? {
          permanent: false,
          renter: ZERO_ADDR,
          rentedAt: 0,
          isOverdue: false,
          daysOverdue: 0,
        },
      );
    }
    return map;
  }, [movies]);

  const onShelf = movies.filter((m) => {
    const r = rentalMap.get(m.id)!;
    return !r.permanent && r.renter === ZERO_ADDR;
  });

  return {
    movies,
    rentalMap,
    onShelf,
    isLoading: false,
    isMock: true as const,
    config: {
      rentPrice: 5_000,
      buyPrice: 50_000,
      gracePeriod: 7 * 86_400,
      lateFeePerDay: 1_000,
      paused: true,
    },
  };
}
