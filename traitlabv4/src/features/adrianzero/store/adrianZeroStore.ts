/**
 * AdrianZERO Store
 * Manages selected token and UI state for AdrianZERO module
 */

import { create } from 'zustand';
import type { AdrianZeroToken } from '@/types/nft.types';

interface AdrianZeroState {
  selectedToken: AdrianZeroToken | null;
  viewMode: 'grid' | 'list';
  sortBy: 'tokenId' | 'name';
  sortOrder: 'asc' | 'desc';
  setSelectedToken: (token: AdrianZeroToken | null) => void;
  setViewMode: (mode: 'grid' | 'list') => void;
  setSortBy: (sortBy: 'tokenId' | 'name') => void;
  toggleSortOrder: () => void;
  clearSelection: () => void;
}

export const useAdrianZeroStore = create<AdrianZeroState>((set) => ({
  selectedToken: null,
  viewMode: 'grid',
  sortBy: 'tokenId',
  sortOrder: 'asc',
  setSelectedToken: (token) => set({ selectedToken: token }),
  setViewMode: (mode) => set({ viewMode: mode }),
  setSortBy: (sortBy) => set({ sortBy }),
  toggleSortOrder: () =>
    set((state) => ({
      sortOrder: state.sortOrder === 'asc' ? 'desc' : 'asc',
    })),
  clearSelection: () => set({ selectedToken: null }),
}));
