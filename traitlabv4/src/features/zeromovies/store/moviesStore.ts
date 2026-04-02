import { create } from 'zustand';

interface MoviesState {
  selectedMovieId: number | null;
  isDetailOpen: boolean;
  isSuccessOpen: boolean;
  lastMintedTokenId: number | null;
  selectMovie: (id: number) => void;
  closeDetail: () => void;
  showSuccess: (tokenId: number) => void;
  closeSuccess: () => void;
}

export const useMoviesStore = create<MoviesState>((set) => ({
  selectedMovieId: null,
  isDetailOpen: false,
  isSuccessOpen: false,
  lastMintedTokenId: null,
  selectMovie: (id) => set({ selectedMovieId: id, isDetailOpen: true }),
  closeDetail: () => set({ isDetailOpen: false }),
  showSuccess: (tokenId) => set({ isSuccessOpen: true, isDetailOpen: false, lastMintedTokenId: tokenId }),
  closeSuccess: () => set({ isSuccessOpen: false, lastMintedTokenId: null }),
}));
