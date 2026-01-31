/**
 * useTraits Hook
 * Fetches user's ERC1155 traits and merges with traits.json metadata
 */

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
  const { address, isConnected } = useAccount();

  return useQuery({
    queryKey: ['traits', address],
    queryFn: async () => {
      if (!address) {
        throw new Error('No wallet connected');
      }

      // Fetch traits.json metadata
      const traitsJsonResponse = await fetch('/data/traits.json');
      const traitsMetadata: Record<string, TraitMetadata> = await traitsJsonResponse.json();

      // Fetch user's ERC1155 tokens from Alchemy
      const response = await alchemyClient.getERC1155Tokens(address, [
        CONTRACT_ADDRESSES.ADRIAN_LAB,
      ]);

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

          return {
            tokenId: nft.tokenId,
            name: metadata.name,
            category: metadata.category,
            fileName: metadata.fileName,
            maxSupply: metadata.maxSupply,
            balance,
            rarity: metadata.rarity,
            metadata: nft.raw?.metadata,
            image: nft.image,
          } as Trait;
        })
        .filter((trait): trait is Trait => trait !== null);

      return traits;
    },
    enabled: isConnected && !!address,
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
