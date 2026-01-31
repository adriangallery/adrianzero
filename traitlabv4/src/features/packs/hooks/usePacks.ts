/**
 * usePacks Hook
 * Fetches user's Floppy Discs and Action Packs
 */

import { useQuery } from '@tanstack/react-query';
import { useAccount } from 'wagmi';
import { alchemyClient } from '@/lib/api/alchemy/client';
import { CONTRACT_ADDRESSES } from '@/config/contracts';
import type { Pack } from '@/types/nft.types';

// Pack configurations
const PACK_CONFIGS = {
  // Floppy Discs (10000-10007)
  FLOPPY_DISCS: {
    contract: CONTRACT_ADDRESSES.ADRIAN_FLOPPY_DISCS,
    ids: ['10000', '10001', '10002', '10003', '10004', '10005', '10006', '10007'],
    type: 'FLOPPY_DISC' as const,
  },
  // Action Packs (15000-15015)
  ACTION_PACKS: {
    contract: CONTRACT_ADDRESSES.ACTION_PACKS,
    ids: [
      '15000', '15001', '15002', '15003', '15004', '15005', '15006', '15007',
      '15008', '15009', '15010', '15011', '15012', '15013', '15014', '15015',
    ],
    type: 'ACTION_PACK' as const,
  },
};

export function usePacks() {
  const { address, isConnected } = useAccount();

  return useQuery({
    queryKey: ['packs', address],
    queryFn: async () => {
      if (!address) {
        throw new Error('No wallet connected');
      }

      // Fetch all ERC1155 tokens
      const response = await alchemyClient.getERC1155Tokens(address, [
        CONTRACT_ADDRESSES.ADRIAN_LAB,
      ]);

      const packs: Pack[] = [];

      // Process each NFT
      response.ownedNfts.forEach((nft) => {
        const balance = parseInt(nft.balance || '0');

        if (balance === 0) return;

        // Check if it's a Floppy Disc
        if (PACK_CONFIGS.FLOPPY_DISCS.ids.includes(nft.tokenId)) {
          packs.push({
            packId: nft.tokenId,
            name: nft.name || `Floppy Disc #${nft.tokenId}`,
            type: 'FLOPPY_DISC',
            contract: PACK_CONFIGS.FLOPPY_DISCS.contract,
            balance,
            metadata: nft.raw?.metadata,
            image: nft.image,
          });
        }

        // Check if it's an Action Pack
        if (PACK_CONFIGS.ACTION_PACKS.ids.includes(nft.tokenId)) {
          packs.push({
            packId: nft.tokenId,
            name: nft.name || `Action Pack #${nft.tokenId}`,
            type: 'ACTION_PACK',
            contract: PACK_CONFIGS.ACTION_PACKS.contract,
            balance,
            metadata: nft.raw?.metadata,
            image: nft.image,
          });
        }
      });

      return packs;
    },
    enabled: isConnected && !!address,
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: false,
  });
}
