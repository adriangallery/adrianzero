import { create } from 'zustand';
import type { Movie2RentalState } from '../types';

const ZERO_ADDR = '0x0000000000000000000000000000000000000000';

type S2Action = 'rent' | 'buy' | 'payLateFee' | 'upgrade' | 'claimGolden';

interface Movies2State {
  // Modal selection
  selectedMovieId: number | null;
  isDetailOpen: boolean;
  selectMovie: (id: number) => void;
  closeDetail: () => void;

  // Local rental overrides — let the mock UI react instantly to "txs"
  // without waiting on a chain that doesn't exist yet. Each override is
  // a partial of Movie2RentalState merged on top of the static mock.
  rentalOverrides: Record<number, Partial<Movie2RentalState>>;
  setRental: (movieId: number, partial: Partial<Movie2RentalState>) => void;
  clearRental: (movieId: number) => void;

  // Toast / success notifier
  lastAction: S2Action | null;
  lastMovieId: number | null;
  isSuccessOpen: boolean;
  showSuccess: (movieId: number, action: S2Action) => void;
  closeSuccess: () => void;

  // Golden mint claimed flag (mocked)
  goldenClaimed: boolean;
  claimedGoldenMovies: number[];
  markGoldenClaimed: (movieIds: number[]) => void;
}

export const useMovies2Store = create<Movies2State>((set) => ({
  selectedMovieId: null,
  isDetailOpen: false,
  selectMovie: (id) => set({ selectedMovieId: id, isDetailOpen: true }),
  closeDetail: () => set({ isDetailOpen: false }),

  rentalOverrides: {},
  setRental: (movieId, partial) =>
    set((s) => ({
      rentalOverrides: {
        ...s.rentalOverrides,
        [movieId]: { ...(s.rentalOverrides[movieId] ?? {}), ...partial },
      },
    })),
  clearRental: (movieId) =>
    set((s) => ({
      rentalOverrides: {
        ...s.rentalOverrides,
        [movieId]: {
          permanent: false,
          renter: ZERO_ADDR,
          rentedAt: 0,
          isOverdue: false,
          daysOverdue: 0,
        },
      },
    })),

  lastAction: null,
  lastMovieId: null,
  isSuccessOpen: false,
  showSuccess: (movieId, action) =>
    set({ lastAction: action, lastMovieId: movieId, isSuccessOpen: true, isDetailOpen: false }),
  closeSuccess: () => set({ isSuccessOpen: false, lastAction: null, lastMovieId: null }),

  goldenClaimed: false,
  claimedGoldenMovies: [],
  markGoldenClaimed: (movieIds) => set({ goldenClaimed: true, claimedGoldenMovies: movieIds }),
}));
