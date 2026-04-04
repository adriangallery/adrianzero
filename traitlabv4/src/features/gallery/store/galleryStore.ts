import { create } from 'zustand';
import type { GalleryState, NFTMetadata, NFTType } from '../types/gallery.types';

export const useGalleryStore = create<GalleryState>((set, get) => ({
  selectedTokenId: null,
  isModalOpen: false,
  tokenIds: [],
  activeFilter: 'All',
  metadataCache: new Map(),

  openModal: (tokenId: number) => {
    set({ selectedTokenId: tokenId, isModalOpen: true });
  },

  closeModal: () => {
    set({ isModalOpen: false, selectedTokenId: null });
  },

  goToNext: () => {
    const { selectedTokenId, tokenIds } = get();
    if (!selectedTokenId || tokenIds.length === 0) return;
    const idx = tokenIds.indexOf(selectedTokenId);
    const nextIdx = (idx + 1) % tokenIds.length;
    set({ selectedTokenId: tokenIds[nextIdx] });
  },

  goToPrevious: () => {
    const { selectedTokenId, tokenIds } = get();
    if (!selectedTokenId || tokenIds.length === 0) return;
    const idx = tokenIds.indexOf(selectedTokenId);
    const prevIdx = idx <= 0 ? tokenIds.length - 1 : idx - 1;
    set({ selectedTokenId: tokenIds[prevIdx] });
  },

  setTokenIds: (ids: number[]) => set({ tokenIds: ids }),

  setActiveFilter: (filter: NFTType | 'All') => set({ activeFilter: filter }),

  setMetadata: (tokenId: number, metadata: NFTMetadata) => {
    set((state) => {
      const newCache = new Map(state.metadataCache);
      newCache.set(tokenId, metadata);
      return { metadataCache: newCache };
    });
  },
}));
