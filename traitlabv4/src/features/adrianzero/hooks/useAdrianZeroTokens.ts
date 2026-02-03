/**
 * useAdrianZeroTokens Hook
 * Fetches AdrianZERO ERC721 tokens for the connected wallet
 * Shows mock data when wallet is not connected
 */

import { useQuery } from '@tanstack/react-query';
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

  return useQuery({
    queryKey: ['adrianzero-tokens', address],
    queryFn: async () => {
      // Return mock data when no wallet is connected
      if (!address) {
        return [MOCK_TOKEN];
      }

      const response = await alchemyClient.getERC721Tokens(address, [
        CONTRACT_ADDRESSES.ADRIAN_ZERO,
      ]);

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

      return tokens;
    },
    enabled: true, // Always enabled to show mock data
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: false,
  });
}
