/**
 * useSerums Hook
 * Derives user's serums (token IDs 262144-262147) from walletDataStore
 * (no extra Alchemy API call — data loaded once by walletDataStore.loadAllTraits)
 */

import { useQuery } from '@tanstack/react-query';
import { useAccount } from 'wagmi';
import { useWalletDataStore } from '@/stores/walletDataStore';
import type { Serum } from '@/types/nft.types';

// Serum token IDs
const SERUM_IDS = new Set(['262144', '262145', '262146', '262147']);

export function useSerums() {
  const { address } = useAccount();
  const rawERC1155Tokens = useWalletDataStore(state => state.rawERC1155Tokens);
  const isLoadingTraits = useWalletDataStore(state => state.isLoadingTraits);

  return useQuery({
    queryKey: ['serums', address],
    queryFn: () => {
      if (!address) {
        throw new Error('No wallet connected');
      }

      const serums: Serum[] = [];

      rawERC1155Tokens.forEach((nft) => {
        if (SERUM_IDS.has(nft.tokenId)) {
          const balance = parseInt(nft.balance || '0');

          if (balance > 0) {
            serums.push({
              tokenId: nft.tokenId,
              name: nft.name || `Serum #${nft.tokenId}`,
              balance,
              metadata: nft.metadata,
              image: nft.image,
            });
          }
        }
      });

      return serums;
    },
    enabled: !!address && !isLoadingTraits,
    staleTime: Infinity, // Data derived from Zustand store — no Alchemy refetch needed
    refetchOnWindowFocus: false,
  });
}
