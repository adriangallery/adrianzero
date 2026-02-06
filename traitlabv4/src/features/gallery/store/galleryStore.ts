import { create } from 'zustand';
import type { GalleryState } from '../types/gallery.types';

export const useGalleryStore = create<GalleryState>((set, get) => ({
  // Modal state
  selectedNFT: null,
  isModalOpen: false,
  currentIndex: 0,
  allNFTs: [],

  // Modal actions
  openModal: (nft, index, allNFTs) => {
    set({
      selectedNFT: nft,
      isModalOpen: true,
      currentIndex: index,
      allNFTs,
    });
  },

  closeModal: () => {
    set({
      isModalOpen: false,
      selectedNFT: null,
    });
  },

  goToNext: () => {
    const { currentIndex, allNFTs } = get();
    if (allNFTs.length === 0) return;

    const nextIndex = (currentIndex + 1) % allNFTs.length;
    set({
      currentIndex: nextIndex,
      selectedNFT: allNFTs[nextIndex],
    });
  },

  goToPrevious: () => {
    const { currentIndex, allNFTs } = get();
    if (allNFTs.length === 0) return;

    const prevIndex = currentIndex === 0 ? allNFTs.length - 1 : currentIndex - 1;
    set({
      currentIndex: prevIndex,
      selectedNFT: allNFTs[prevIndex],
    });
  },

  // Auto-scroll state
  isAutoScrollPlaying: false,
  scrollVelocity: 1,

  toggleAutoScroll: () => {
    set((state) => ({
      isAutoScrollPlaying: !state.isAutoScrollPlaying,
    }));
  },

  setScrollVelocity: (v) => {
    set({ scrollVelocity: v });
  },

  // Metadata cache
  metadataCache: new Map(),

  setMetadata: (tokenId, metadata) => {
    set((state) => {
      const newCache = new Map(state.metadataCache);
      newCache.set(tokenId, metadata);

      // Clear cache if it exceeds 100 entries
      if (newCache.size > 100) {
        const firstKey = newCache.keys().next().value;
        if (firstKey) newCache.delete(firstKey);
      }

      return { metadataCache: newCache };
    });
  },
}));
