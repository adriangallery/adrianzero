import { create } from 'zustand';

interface MoviesState {
  selectedMovieId: number | null;
  isDetailOpen: boolean;
  isSuccessOpen: boolean;
  lastMintedTokenId: number | null;
  lastAction: 'rent' | 'buy' | null;
  selectMovie: (id: number) => void;
  closeDetail: () => void;
  showSuccess: (tokenId: number, action: 'rent' | 'buy') => void;
  closeSuccess: () => void;
}

export const useMoviesStore = create<MoviesState>((set) => ({
  selectedMovieId: null,
  isDetailOpen: false,
  isSuccessOpen: false,
  lastMintedTokenId: null,
  lastAction: null,
  selectMovie: (id) => set({ selectedMovieId: id, isDetailOpen: true }),
  closeDetail: () => set({ isDetailOpen: false }),
  showSuccess: (tokenId, action) => set({ isSuccessOpen: true, isDetailOpen: false, lastMintedTokenId: tokenId, lastAction: action }),
  closeSuccess: () => set({ isSuccessOpen: false, lastMintedTokenId: null, lastAction: null }),
}));
