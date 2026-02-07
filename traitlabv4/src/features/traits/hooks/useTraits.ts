/**
 * useTraits Hook
 * Fetches user's ERC1155 traits and merges with traits.json metadata
 * Shows mock data when wallet is not connected
 *
 * OPTIMIZED: Uses centralized walletDataStore to load ALL traits once
 * No more infinite query pagination - data is loaded upfront and stored
 */

import { useMemo } from 'react';
import { useAccount } from 'wagmi';
import { useWalletDataStore, selectTraits } from '@/stores/walletDataStore';
import type { Trait, TraitCategory } from '@/types/nft.types';

// Mock trait IDs for demo when wallet not connected
const MOCK_TRAIT_IDS = ['444', '700', '83', '7', '1007', '754', '852', '33', '420', '456', '460', '550'];

export function useTraits() {
  const { address } = useAccount();

  // Get data from centralized store (loads ALL traits once on wallet connect)
  const traits = useWalletDataStore(selectTraits);
  const traitsMetadata = useWalletDataStore(state => state.traitsMetadata);
  const isLoadingTraits = useWalletDataStore(state => state.isLoadingTraits);
  const isLoadingMetadata = useWalletDataStore(state => state.isLoadingMetadata);
  const traitsError = useWalletDataStore(state => state.traitsError);

  // Mock traits for when wallet is not connected
  const mockTraits = useMemo(() => {
    if (address || !traitsMetadata) {
      return [] as Trait[];
    }

    return MOCK_TRAIT_IDS
      .map((tokenId) => {
        const metadata = traitsMetadata[tokenId];
        if (!metadata) return null;

        const githubSvgUrl = `https://raw.githubusercontent.com/adriangallery/adrianzero/main/traitlabv3/assets/traits/${tokenId}.svg`;
        const fallbackUrl = `https://adrianzero.com/traitlab/${metadata.category.toLowerCase()}/${metadata.fileName}`;

        return {
          tokenId,
          name: metadata.name,
          category: metadata.category.toUpperCase(),
          fileName: metadata.fileName,
          maxSupply: metadata.maxSupply,
          balance: 1,
          rarity: metadata.rarity,
          image: {
            cachedUrl: githubSvgUrl,
            originalUrl: fallbackUrl,
          },
        } as Trait;
      })
      .filter((trait): trait is Trait => trait !== null);
  }, [address, traitsMetadata]);

  const data = address ? traits : mockTraits;
  const isLoading = isLoadingMetadata || (Boolean(address) && isLoadingTraits);

  return {
    data,
    isLoading,
    error: traitsError,
    refetch: () => {}, // No-op: data loaded once, no refetch needed
    fetchNextPage: () => Promise.resolve(), // No-op for API compatibility
    hasNextPage: false, // All data loaded
    isFetchingNextPage: false, // All data loaded
    loadedCount: data.length,
    totalCount: data.length, // We have everything
  };
}

export function useTraitsByCategory() {
  const { data: traits = [], ...rest } = useTraits();

  const traitsByCategory = traits.reduce((acc, trait) => {
    const cat = trait.category;
    if (!acc[cat]) {
      acc[cat] = [];
    }
    acc[cat].push(trait);
    return acc;
  }, {} as Record<TraitCategory, Trait[]>);

  return {
    data: traitsByCategory,
    allTraits: traits,
    ...rest,
  };
}

/**
 * Hook to get all unique trait categories from user's traits
 * Dynamically generates categories based on actual data
 */
export function useTraitCategories() {
  const { data: traits = [] } = useTraits();

  return useMemo(() => {
    const categories = new Set<TraitCategory>();
    traits.forEach(trait => {
      if (trait.category) {
        categories.add(trait.category);
      }
    });
    return Array.from(categories).sort();
  }, [traits]);
}
