/**
 * useSerums Hook
 * Fetches user's serums (token IDs 262144-262147)
 */

import { useQuery } from '@tanstack/react-query';
import { useAccount } from 'wagmi';
import { alchemyClient } from '@/lib/api/alchemy/client';
import { CONTRACT_ADDRESSES } from '@/config/contracts';
import type { Serum } from '@/types/nft.types';

// Serum token IDs
const SERUM_IDS = ['262144', '262145', '262146', '262147'];

export function useSerums() {
  const { address } = useAccount();

  return useQuery({
    queryKey: ['serums', address],
    queryFn: async () => {
      if (!address) {
        throw new Error('No wallet connected');
      }

      // Fetch all ERC1155 tokens
      const response = await alchemyClient.getERC1155Tokens(address, [
        CONTRACT_ADDRESSES.ADRIAN_LAB,
      ]);

      const serums: Serum[] = [];

      // Filter for serum token IDs
      response.ownedNfts.forEach((nft) => {
        if (SERUM_IDS.includes(nft.tokenId)) {
          const balance = parseInt(nft.balance || '0');

          if (balance > 0) {
            serums.push({
              tokenId: nft.tokenId,
              name: nft.name || `Serum #${nft.tokenId}`,
              balance,
              metadata: nft.raw?.metadata,
              image: nft.image,
            });
          }
        }
      });

      return serums;
    },
    enabled: !!address,
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: false,
  });
}
