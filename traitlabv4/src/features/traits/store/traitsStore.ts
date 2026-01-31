/**
 * Traits Store
 * Manages trait selection state (max 1 per category)
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Trait, TraitCategory } from '@/types/nft.types';

interface TraitsState {
  selectedTraits: Map<TraitCategory, Trait>;
  targetTokenId: string | null;
  setTargetToken: (tokenId: string | null) => void;
  selectTrait: (trait: Trait) => boolean;
  deselectTrait: (category: TraitCategory) => void;
  clearSelection: () => void;
  getSelectedTraitsArray: () => Trait[];
  getSelectedTraitIds: () => string[];
  isTraitSelected: (trait: Trait) => boolean;
}

export const useTraitsStore = create<TraitsState>()(
  persist(
    (set, get) => ({
      selectedTraits: new Map(),
      targetTokenId: null,

      setTargetToken: (tokenId) => set({ targetTokenId: tokenId }),

      selectTrait: (trait) => {
        const { selectedTraits } = get();
        const newSelection = new Map(selectedTraits);

        // Only allow 1 trait per category
        newSelection.set(trait.category, trait);

        set({ selectedTraits: newSelection });
        return true;
      },

      deselectTrait: (category) => {
        const { selectedTraits } = get();
        const newSelection = new Map(selectedTraits);
        newSelection.delete(category);
        set({ selectedTraits: newSelection });
      },

      clearSelection: () => {
        set({ selectedTraits: new Map(), targetTokenId: null });
      },

      getSelectedTraitsArray: () => {
        const { selectedTraits } = get();
        return Array.from(selectedTraits.values());
      },

      getSelectedTraitIds: () => {
        const { selectedTraits } = get();
        return Array.from(selectedTraits.values()).map((t) => t.tokenId);
      },

      isTraitSelected: (trait) => {
        const { selectedTraits } = get();
        const selected = selectedTraits.get(trait.category);
        return selected?.tokenId === trait.tokenId;
      },
    }),
    {
      name: 'traits-selection',
      // Custom serialization for Map
      partialize: (state) => ({
        targetTokenId: state.targetTokenId,
        selectedTraits: Array.from(state.selectedTraits.entries()),
      }),
      // Custom deserialization for Map
      merge: (persistedState: any, currentState) => ({
        ...currentState,
        ...persistedState,
        selectedTraits: new Map(persistedState.selectedTraits || []),
      }),
    }
  )
);
