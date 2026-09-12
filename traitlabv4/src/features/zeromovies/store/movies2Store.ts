import { create } from 'zustand';

interface Movies2State {
  // Modal selection
  selectedMovieId: number | null;
  isDetailOpen: boolean;
  selectMovie: (id: number) => void;
  closeDetail: () => void;
}

/**
 * S2 catalog + rental state now come straight from the chain (see
 * `useMovies2Catalog` / `useMovie2Actions`). This store only tracks UI-local
 * selection state — the mock-era `rentalOverrides` / success-toast /
 * golden-claimed fields were removed once `useMovie2Actions` started firing
 * real transactions: the source of truth after a tx is a catalog refetch,
 * not a client-side override, and the golden-claimed flag now comes from
 * `isGolden2Claimed(address)` via `useGoldenEligibility`. Success/error
 * feedback moved to the app-wide `useNotificationStore` (`src/ui/Toast`).
 */
export const useMovies2Store = create<Movies2State>((set) => ({
  selectedMovieId: null,
  isDetailOpen: false,
  selectMovie: (id) => set({ selectedMovieId: id, isDetailOpen: true }),
  closeDetail: () => set({ isDetailOpen: false }),
}));
