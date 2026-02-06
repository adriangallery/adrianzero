/**
 * useTraits Hook
 * Fetches user's ERC1155 traits and merges with traits.json metadata
 * Shows mock data when wallet is not connected
 */

import { useMemo } from 'react';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
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

// Mock trait IDs for demo when wallet not connected
const MOCK_TRAIT_IDS = ['444', '700', '83', '7', '1007', '754', '852', '33', '420', '456', '460', '550'];

export function useTraits() {
  const { address } = useAccount();
  const metadataQuery = useQuery({
    queryKey: ['traits-metadata'],
    queryFn: async () => {
      const traitsJsonResponse = await fetch('/data/traits.json');
      const traitsJson = await traitsJsonResponse.json();

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

      return traitsMetadata;
    },
    staleTime: 1000 * 60 * 60,
    refetchOnWindowFocus: false,
  });

  const traitsInfiniteQuery = useInfiniteQuery({
    queryKey: ['traits', address],
    initialPageParam: undefined as string | undefined,
    enabled: !!address && !!metadataQuery.data,
    queryFn: async ({ pageParam }) => {
      const response = await alchemyClient.getERC1155TokensPage(address as string, [
        CONTRACT_ADDRESSES.ADRIAN_LAB,
      ], pageParam);

      const traits: Trait[] = response.ownedNfts
        .map((nft) => {
          const metadata = metadataQuery.data?.[nft.tokenId];

          if (!metadata) {
            return null;
          }

          const balance = parseInt(nft.balance || '0');
          if (balance === 0) {
            return null;
          }

          const githubSvgUrl = `https://raw.githubusercontent.com/adriangallery/adrianzero/main/traitlabv3/assets/traits/${nft.tokenId}.svg`;
          const fallbackUrl = `https://adrianzero.com/traitlab/${metadata.category.toLowerCase()}/${metadata.fileName}`;

          return {
            tokenId: nft.tokenId,
            name: metadata.name,
            category: metadata.category.toUpperCase(),
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

      return {
        traits,
        nextPageKey: response.pageKey,
        totalCount: response.totalCount,
      };
    },
    getNextPageParam: (lastPage) => lastPage.nextPageKey,
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
  });

  const mockTraits = useMemo(() => {
    if (address || !metadataQuery.data) {
      return [] as Trait[];
    }

    return MOCK_TRAIT_IDS
      .map((tokenId) => {
        const metadata = metadataQuery.data[tokenId];
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
  }, [address, metadataQuery.data]);

  const mergedWalletTraits = new Map<string, Trait>();
  (traitsInfiniteQuery.data?.pages || []).forEach((page) => {
    page.traits.forEach((trait) => {
      mergedWalletTraits.set(trait.tokenId, trait);
    });
  });
  const walletTraits = Array.from(mergedWalletTraits.values());

  const data = address ? walletTraits : mockTraits;
  const isLoading = metadataQuery.isLoading || (Boolean(address) && traitsInfiniteQuery.isLoading);
  const isFetchingNextPage = traitsInfiniteQuery.isFetchingNextPage;
  const fetchNextPage = traitsInfiniteQuery.fetchNextPage;
  const hasNextPage = Boolean(address) && Boolean(traitsInfiniteQuery.hasNextPage);
  const totalCount = useMemo(() => {
    if (!address) {
      return mockTraits.length;
    }
    const pages = traitsInfiniteQuery.data?.pages || [];
    if (pages.length === 0) {
      return 0;
    }
    const lastTotal = pages[pages.length - 1]?.totalCount || 0;
    return Math.max(lastTotal, walletTraits.length);
  }, [address, mockTraits.length, traitsInfiniteQuery.data?.pages, walletTraits.length]);

  return {
    data,
    isLoading,
    error: metadataQuery.error || traitsInfiniteQuery.error,
    refetch: traitsInfiniteQuery.refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    loadedCount: data.length,
    totalCount,
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
