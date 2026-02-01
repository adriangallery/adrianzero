/**
 * useTraits Hook
 * Fetches user's ERC1155 traits and merges with traits.json metadata
 */

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAccount } from 'wagmi';
import { alchemyClient } from '@/lib/api/alchemy/client';
import { CONTRACT_ADDRESSES } from '@/config/contracts';
import type { Trait, TraitCategory } from '@/types/nft.types';

interface TraitMetadata {
  tokenId: string;
  name: string;
  category: TraitCategory;
  fileName: string;
  maxSupply: number;
  rarity?: 'common' | 'rare' | 'epic' | 'legendary';
}

export function useTraits() {
  const { address } = useAccount();

  return useQuery({
    queryKey: ['traits', address],
    queryFn: async () => {
      if (!address) {
        throw new Error('No wallet connected');
      }

      console.log('[useTraits] Fetching traits for address:', address);

      // Fetch traits.json metadata
      const traitsJsonResponse = await fetch('/data/traits.json');
      const traitsJson = await traitsJsonResponse.json();

      // Convert array to object indexed by tokenId
      const traitsMetadata: Record<string, TraitMetadata> = {};
      if (traitsJson.traits && Array.isArray(traitsJson.traits)) {
        traitsJson.traits.forEach((trait: any) => {
          traitsMetadata[trait.tokenId.toString()] = {
            tokenId: trait.tokenId.toString(),
            name: trait.name,
            category: trait.category,
            fileName: trait.fileName,
            maxSupply: trait.maxSupply,
            rarity: trait.rarity,
          };
        });
      }

      console.log('[useTraits] Loaded traits metadata, count:', Object.keys(traitsMetadata).length);

      // Fetch user's ERC1155 tokens from Alchemy
      const response = await alchemyClient.getERC1155Tokens(address, [
        CONTRACT_ADDRESSES.ADRIAN_LAB,
      ]);
      console.log('[useTraits] Alchemy returned', response.ownedNfts.length, 'ERC1155 tokens');

      // Merge user balances with metadata
      const traits: Trait[] = response.ownedNfts
        .map((nft) => {
          const metadata = traitsMetadata[nft.tokenId];

          if (!metadata) {
            // Skip if no metadata found
            return null;
          }

          const balance = parseInt(nft.balance || '0');

          // Only include traits with balance > 0
          if (balance === 0) {
            return null;
          }

          // Use GitHub-hosted SVG with fallback to adrianzero.com
          const githubSvgUrl = `https://raw.githubusercontent.com/adriangallery/adrianzero/main/traitlabv3/assets/traits/${nft.tokenId}.svg`;
          const fallbackUrl = `https://adrianzero.com/traitlab/${metadata.category.toLowerCase()}/${metadata.fileName}`;

          return {
            tokenId: nft.tokenId,
            name: metadata.name,
            category: metadata.category.toUpperCase(), // Normalize to uppercase
            fileName: metadata.fileName,
            maxSupply: metadata.maxSupply,
            balance,
            rarity: metadata.rarity,
            metadata: nft.raw?.metadata,
            image: {
              cachedUrl: githubSvgUrl,
              originalUrl: fallbackUrl,
            },
          } as Trait;
        })
        .filter((trait): trait is Trait => trait !== null);

      console.log('[useTraits] Processed traits:', traits.length);
      console.log('[useTraits] Sample traits:', traits.slice(0, 3));

      return traits;
    },
    enabled: !!address,
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: false,
  });
}

export function useTraitsByCategory() {
  const { data: traits = [], ...rest } = useTraits();

  const traitsByCategory = traits.reduce((acc, trait) => {
    if (!acc[trait.category]) {
      acc[trait.category] = [];
    }
    acc[trait.category].push(trait);
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
