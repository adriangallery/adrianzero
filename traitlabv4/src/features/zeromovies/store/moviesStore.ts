import { create } from 'zustand';

interface MoviesState {
  selectedMovieId: number | null;
  isDetailOpen: boolean;
  isSuccessOpen: boolean;
  lastMintedTokenId: number | null;
  lastAction: 'rent' | 'buy' | 'return' | null;
  returnedDeposit: number;
  selectMovie: (id: number) => void;
  closeDetail: () => void;
  showSuccess: (tokenId: number, action: 'rent' | 'buy' | 'return', deposit?: number) => void;
  closeSuccess: () => void;
}

export const useMoviesStore = create<MoviesState>((set) => ({
  selectedMovieId: null,
  isDetailOpen: false,
  isSuccessOpen: false,
  lastMintedTokenId: null,
  lastAction: null,
  returnedDeposit: 0,
  selectMovie: (id) => set({ selectedMovieId: id, isDetailOpen: true }),
  closeDetail: () => set({ isDetailOpen: false }),
  showSuccess: (tokenId, action, deposit) => set({ isSuccessOpen: true, isDetailOpen: false, lastMintedTokenId: tokenId, lastAction: action, returnedDeposit: deposit ?? 0 }),
  closeSuccess: () => set({ isSuccessOpen: false, lastMintedTokenId: null, lastAction: null, returnedDeposit: 0 }),
}));
