/**
 * useAdrianZeroTokens Hook
 * Fetches AdrianZERO ERC721 tokens for the connected wallet
 * Shows mock data when wallet is not connected
 */

import { useInfiniteQuery } from '@tanstack/react-query';
import { useAccount } from 'wagmi';
import { alchemyClient } from '@/lib/api/alchemy/client';
import { CONTRACT_ADDRESSES } from '@/config/contracts';
import type { AdrianZeroToken } from '@/types/nft.types';

const MOCK_TOKEN: AdrianZeroToken = {
  tokenId: '146',
  owner: '0x0000000000000000000000000000000000000000',
  name: 'AdrianZERO #146',
  metadata: {
    name: 'AdrianZERO #146',
    description: 'AdrianZERO Collection',
    image: 'https://adrianlab.vercel.app/api/render/146',
  },
  image: {
    cachedUrl: 'https://adrianlab.vercel.app/api/render/146',
    originalUrl: 'https://adrianlab.vercel.app/api/render/146',
  },
  tokenUri: '',
};

export function useAdrianZeroTokens() {
  const { address } = useAccount();

  const query = useInfiniteQuery({
    queryKey: ['adrianzero-tokens', address],
    initialPageParam: undefined as string | undefined,
    queryFn: async ({ pageParam }) => {
      if (!address) {
        return {
          tokens: [MOCK_TOKEN],
          nextPageKey: undefined,
          totalCount: 1,
        };
      }

      const response = await alchemyClient.getERC721TokensPage(address, [
        CONTRACT_ADDRESSES.ADRIAN_ZERO,
      ], pageParam);

      // Transform Alchemy response to our AdrianZeroToken type
      // Use Vercel API for images: https://adrianlab.vercel.app/api/render/{tokenId}
      const tokens: AdrianZeroToken[] = response.ownedNfts.map((nft) => {
        const vercelImageUrl = `https://adrianlab.vercel.app/api/render/${nft.tokenId}`;
        const alchemyFallback = nft.image?.cachedUrl || nft.image?.originalUrl;

        return {
          tokenId: nft.tokenId,
          owner: address,
          name: nft.name,
          metadata: nft.raw?.metadata,
          image: {
            cachedUrl: vercelImageUrl,
            originalUrl: alchemyFallback,
            thumbnailUrl: nft.image?.thumbnailUrl,
          },
          tokenUri: nft.tokenUri,
        };
      });

      return {
        tokens,
        nextPageKey: response.pageKey,
        totalCount: response.totalCount,
      };
    },
    getNextPageParam: (lastPage) => lastPage.nextPageKey,
    enabled: true, // Always enabled to show mock data
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: false,
  });

  const pages = query.data?.pages || [];
  const seen = new Set<string>();
  const flattenedTokens: AdrianZeroToken[] = [];

  pages.forEach((page) => {
    page.tokens.forEach((token) => {
      const key = token.tokenId;
      if (seen.has(key)) return;
      seen.add(key);
      flattenedTokens.push(token);
    });
  });

  const totalCount = pages.length === 0
    ? (address ? 0 : 1)
    : Math.max(pages[pages.length - 1]?.totalCount || 0, flattenedTokens.length);

  return {
    ...query,
    data: flattenedTokens,
    loadedCount: flattenedTokens.length,
    totalCount,
  };
}
