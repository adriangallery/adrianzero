/**
 * usePacks Hook
 * Fetches user's Floppy Discs and Action Packs
 */

import { useQuery } from '@tanstack/react-query';
import { useAccount } from 'wagmi';
import { alchemyClient } from '@/lib/api/alchemy/client';
import { CONTRACT_ADDRESSES } from '@/config/contracts';
import type { Pack } from '@/types/nft.types';

// Comprehensive pack configurations with all token IDs and names
const PACK_METADATA: Record<string, { name: string; type: 'FLOPPY_DISC' | 'ACTION_PACK' | 'SPECIAL'; contract: string; special?: boolean }> = {
  // Floppy Discs (10000-10019)
  '10000': { name: 'GLITCH Floppy', type: 'FLOPPY_DISC', contract: 'OPENPACK_V4' },
  '10001': { name: 'ZeroHour Floppy', type: 'FLOPPY_DISC', contract: 'OPENPACK_V4' },
  '10002': { name: 'NEON Floppy', type: 'FLOPPY_DISC', contract: 'OPENPACK_V4' },
  '10003': { name: 'WAR Floppy', type: 'FLOPPY_DISC', contract: 'OPENPACK_V4' },
  '10004': { name: 'MUTANT Floppy', type: 'FLOPPY_DISC', contract: 'OPENPACK_V4' },
  '10005': { name: 'CYPHER Floppy', type: 'FLOPPY_DISC', contract: 'OPENPACK_V4' },
  '10006': { name: 'OUTRUN Floppy', type: 'FLOPPY_DISC', contract: 'OPENPACK_V4' },
  '10007': { name: 'Golden Floppy', type: 'FLOPPY_DISC', contract: 'ACTION_PACK_10007', special: true },
  '10008': { name: 'OG Floppy', type: 'FLOPPY_DISC', contract: 'OPENPACK_V4' },
  '10009': { name: 'ZEROHOUR Floppy #9', type: 'FLOPPY_DISC', contract: 'OPENPACK_V4' },
  '10010': { name: 'ZEROHOUR Floppy #10', type: 'FLOPPY_DISC', contract: 'OPENPACK_V4' },
  '10011': { name: 'ZEROHOUR Floppy #11', type: 'FLOPPY_DISC', contract: 'OPENPACK_V4' },
  '10012': { name: 'ZEROHOUR Floppy #12', type: 'FLOPPY_DISC', contract: 'OPENPACK_V4' },
  '10013': { name: 'ZEROHOUR Floppy #13', type: 'FLOPPY_DISC', contract: 'OPENPACK_V4' },
  '10014': { name: 'ZEROHOUR Floppy #14', type: 'FLOPPY_DISC', contract: 'OPENPACK_V4' },
  '10015': { name: 'ZEROHOUR Floppy #15', type: 'FLOPPY_DISC', contract: 'OPENPACK_V4' },
  '10016': { name: 'ZEROHOUR Floppy #16', type: 'FLOPPY_DISC', contract: 'OPENPACK_V4' },
  '10017': { name: 'ZEROHOUR Floppy #17', type: 'FLOPPY_DISC', contract: 'OPENPACK_V4' },
  '10018': { name: 'ZEROHOUR Floppy #18', type: 'FLOPPY_DISC', contract: 'OPENPACK_V4' },
  '10019': { name: 'ZEROHOUR Floppy #19', type: 'FLOPPY_DISC', contract: 'OPENPACK_V4' },

  // Action Packs (15000-15015)
  '15000': { name: 'ActionPACK #1', type: 'ACTION_PACK', contract: 'ACTION_PACK' },
  '15001': { name: 'ActionPACK #2', type: 'ACTION_PACK', contract: 'ACTION_PACK' },
  '15002': { name: 'ActionPACK #3', type: 'ACTION_PACK', contract: 'ACTION_PACK' },
  '15003': { name: 'ActionPACK #4', type: 'ACTION_PACK', contract: 'ACTION_PACK' },
  '15004': { name: 'ActionPACK #5', type: 'ACTION_PACK', contract: 'ACTION_PACK' },
  '15005': { name: 'ActionPACK #6', type: 'ACTION_PACK', contract: 'ACTION_PACK' },
  '15006': { name: 'ActionPACK #7', type: 'ACTION_PACK', contract: 'ACTION_PACK' },
  '15007': { name: 'ActionPACK #8', type: 'ACTION_PACK', contract: 'ACTION_PACK' },
  '15008': { name: 'ActionPACK #9', type: 'ACTION_PACK', contract: 'ACTION_PACK' },
  '15009': { name: 'ActionPACK #10', type: 'ACTION_PACK', contract: 'ACTION_PACK' },
  '15010': { name: 'ActionPACK #11', type: 'ACTION_PACK', contract: 'ACTION_PACK' },
  '15011': { name: 'ActionPACK #12', type: 'ACTION_PACK', contract: 'ACTION_PACK' },
  '15012': { name: 'ActionPACK #13', type: 'ACTION_PACK', contract: 'ACTION_PACK' },
  '15013': { name: 'ActionPACK #14', type: 'ACTION_PACK', contract: 'ACTION_PACK' },
  '15014': { name: 'ActionPACK #15', type: 'ACTION_PACK', contract: 'ACTION_PACK' },
  '15015': { name: 'ActionPACK #16', type: 'ACTION_PACK', contract: 'ACTION_PACK' },

  // Special Packs
  '1123': { name: 'CensorPACK', type: 'SPECIAL', contract: 'OPENPACK_V4', special: true },
};

export function usePacks() {
  const { address } = useAccount();

  return useQuery({
    queryKey: ['packs', address],
    queryFn: async () => {
      if (!address) {
        throw new Error('No wallet connected');
      }

      // Fetch all ERC1155 tokens from ADRIAN_LAB contract
      const response = await alchemyClient.getERC1155Tokens(address, [
        CONTRACT_ADDRESSES.ADRIAN_LAB,
      ]);

      const packs: Pack[] = [];

      // Process each NFT
      response.ownedNfts.forEach((nft) => {
        const balance = parseInt(nft.balance || '0');

        if (balance === 0) return;

        // Check if token ID is in our pack metadata
        const packConfig = PACK_METADATA[nft.tokenId];
        if (packConfig) {
          packs.push({
            packId: nft.tokenId,
            name: packConfig.name,
            type: packConfig.type,
            contract: packConfig.contract,
            balance,
            metadata: nft.raw?.metadata,
            image: nft.image,
            special: packConfig.special,
          });
        }
      });

      console.log('[usePacks] Found packs:', packs.length);
      return packs;
    },
    enabled: !!address,
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: false,
  });
}
