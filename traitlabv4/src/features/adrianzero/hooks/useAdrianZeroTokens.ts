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
    image: 'https://res.cloudinary.com/alchemyapi/image/upload/mainnet/0e8c6bc2c0e6ecf93a8e79e5a2c8c0f4.png',
  },
  image: {
    cachedUrl: 'https://res.cloudinary.com/alchemyapi/image/upload/mainnet/0e8c6bc2c0e6ecf93a8e79e5a2c8c0f4.png',
    originalUrl: 'https://res.cloudinary.com/alchemyapi/image/upload/mainnet/0e8c6bc2c0e6ecf93a8e79e5a2c8c0f4.png',
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
      // Use Alchemy images (GitHub integration pending - needs hash resolution)
      const tokens: AdrianZeroToken[] = response.ownedNfts.map((nft) => ({
        tokenId: nft.tokenId,
        owner: address,
        name: nft.name,
        metadata: nft.raw?.metadata,
        image: nft.image,
        tokenUri: nft.tokenUri,
      }));

      return tokens;
    },
    enabled: true, // Always enabled to show mock data
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: false,
  });
}
