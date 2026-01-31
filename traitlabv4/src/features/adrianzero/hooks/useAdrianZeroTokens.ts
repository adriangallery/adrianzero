/**
 * useAdrianZeroTokens Hook
 * Fetches AdrianZERO ERC721 tokens for the connected wallet
 */

import { useQuery } from '@tanstack/react-query';
import { useAccount } from 'wagmi';
import { alchemyClient } from '@/lib/api/alchemy/client';
import { CONTRACT_ADDRESSES } from '@/config/contracts';
import type { AdrianZeroToken } from '@/types/nft.types';

export function useAdrianZeroTokens() {
  const { address } = useAccount();

  return useQuery({
    queryKey: ['adrianzero-tokens', address],
    queryFn: async () => {
      if (!address) {
        throw new Error('No wallet connected');
      }

      const response = await alchemyClient.getERC721Tokens(address, [
        CONTRACT_ADDRESSES.ADRIAN_ZERO,
      ]);

      // Transform Alchemy response to our AdrianZeroToken type
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
    enabled: !!address,
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: false,
  });
}
