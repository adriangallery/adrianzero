/**
 * OGCLAIM Store
 * Zustand store for managing OG claim state
 */

import { create } from 'zustand';

interface OGClaimState {
  selectedPunks: number[];

  togglePunkSelection: (punkId: number) => void;
  selectAllPunks: (punkIds: number[]) => void;
  clearSelection: () => void;
  isSelected: (punkId: number) => boolean;
}

export const useOGClaimStore = create<OGClaimState>((set, get) => ({
  selectedPunks: [],

  togglePunkSelection: (punkId) =>
    set((state) => {
      const isSelected = state.selectedPunks.includes(punkId);
      return {
        selectedPunks: isSelected
          ? state.selectedPunks.filter((id) => id !== punkId)
          : [...state.selectedPunks, punkId],
      };
    }),

  selectAllPunks: (punkIds) => set({ selectedPunks: punkIds }),

  clearSelection: () => set({ selectedPunks: [] }),

  isSelected: (punkId) => get().selectedPunks.includes(punkId),
}));
