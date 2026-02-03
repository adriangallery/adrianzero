/**
 * useAdrianZeroTokens Hook
 * Fetches AdrianZERO ERC721 tokens for the connected wallet
 * Shows mock data when wallet is not connected
 */

import { useQuery } from '@tanstack/react-query';
import { useAccount } from 'wagmi';
import { alchemyClient } from '@/lib/api/alchemy/client';
import { githubImageService } from '@/lib/api/github/imageService';
import { CONTRACT_ADDRESSES } from '@/config/contracts';
import type { AdrianZeroToken } from '@/types/nft.types';

const MOCK_TOKEN: AdrianZeroToken = {
  tokenId: '146',
  owner: '0x0000000000000000000000000000000000000000',
  name: 'AdrianZERO #146',
  metadata: {
    name: 'AdrianZERO #146',
    description: 'AdrianZERO Collection',
    image: 'https://github.com/adriangallery/AdrianLAB/blob/main/public/rendered-toggles/146_latest.png?raw=true',
  },
  image: {
    cachedUrl: 'https://github.com/adriangallery/AdrianLAB/blob/main/public/rendered-toggles/146_latest.png?raw=true',
    originalUrl: 'https://github.com/adriangallery/AdrianLAB/blob/main/public/rendered-toggles/146_latest.png?raw=true',
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
      // Use GitHub as primary image source with Alchemy as fallback
      const tokens: AdrianZeroToken[] = response.ownedNfts.map((nft) => {
        const alchemyImageUrl = nft.image?.cachedUrl || nft.image?.originalUrl;
        const githubUrls = githubImageService.getAdrianZeroImageUrls(
          nft.tokenId,
          alchemyImageUrl
        );

        return {
          tokenId: nft.tokenId,
          owner: address,
          name: nft.name,
          metadata: nft.raw?.metadata,
          image: {
            cachedUrl: githubUrls.primaryUrl,
            originalUrl: githubUrls.fallbackUrl,
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
