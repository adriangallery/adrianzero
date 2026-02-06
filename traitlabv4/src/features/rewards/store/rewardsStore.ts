/**
 * REWARDS Store
 * Zustand store for managing rewards state
 */

import { create } from 'zustand';
import type { Campaign } from '../types/rewards.types';

interface RewardsState {
  campaigns: Campaign[];
  selectedPunks: Record<number, number[]>; // campaignId -> punkIds[]

  setCampaigns: (campaigns: Campaign[]) => void;
  togglePunkSelection: (campaignId: number, punkId: number) => void;
  selectAllPunks: (campaignId: number, punkIds: number[]) => void;
  clearSelection: (campaignId: number) => void;
  clearAllSelections: () => void;
}

export const useRewardsStore = create<RewardsState>((set) => ({
  campaigns: [],
  selectedPunks: {},

  setCampaigns: (campaigns) => set({ campaigns }),

  togglePunkSelection: (campaignId, punkId) =>
    set((state) => {
      const current = state.selectedPunks[campaignId] || [];
      const isSelected = current.includes(punkId);

      return {
        selectedPunks: {
          ...state.selectedPunks,
          [campaignId]: isSelected
            ? current.filter((id) => id !== punkId)
            : [...current, punkId],
        },
      };
    }),

  selectAllPunks: (campaignId, punkIds) =>
    set((state) => ({
      selectedPunks: {
        ...state.selectedPunks,
        [campaignId]: punkIds,
      },
    })),

  clearSelection: (campaignId) =>
    set((state) => ({
      selectedPunks: {
        ...state.selectedPunks,
        [campaignId]: [],
      },
    })),

  clearAllSelections: () => set({ selectedPunks: {} }),
}));
