import { useMemo } from 'react';
import { MOVIES_S2_MOCK, MOVIES_S2_RENTAL_MOCK } from '../data/movies2Mock';
import { useMovies2Store } from '../store/movies2Store';
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
  const overrides = useMovies2Store((s) => s.rentalOverrides);

  const rentalMap = useMemo(() => {
    const map = new Map<number, Movie2RentalState>();
    const nowSec = Math.floor(Date.now() / 1000);
    const grace = 7 * 86_400;

    for (const m of movies) {
      const base: Movie2RentalState = MOVIES_S2_RENTAL_MOCK[m.id] ?? {
        permanent: false,
        renter: ZERO_ADDR,
        rentedAt: 0,
        isOverdue: false,
        daysOverdue: 0,
      };
      const ov = overrides[m.id];
      const merged: Movie2RentalState = ov ? { ...base, ...ov } : base;

      // Re-derive overdue from rentedAt + gracePeriod when not explicitly set.
      // Mirrors what the on-chain getMovie2RentalInfo would return.
      if (
        !merged.permanent &&
        merged.renter !== ZERO_ADDR &&
        merged.rentedAt > 0 &&
        ov?.isOverdue === undefined
      ) {
        const overdueAt = merged.rentedAt + grace;
        if (nowSec > overdueAt) {
          merged.isOverdue = true;
          merged.daysOverdue = Math.max(1, Math.floor((nowSec - overdueAt) / 86_400));
        } else {
          merged.isOverdue = false;
          merged.daysOverdue = 0;
        }
      }

      map.set(m.id, merged);
    }
    return map;
  }, [movies, overrides]);

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
