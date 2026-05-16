/**
 * usePacks Hook
 * Derives user's Floppy Discs and Action Packs from walletDataStore
 * (no extra Alchemy API call — data loaded once by walletDataStore.loadAllTraits)
 */

import { useQuery } from '@tanstack/react-query';
import { useAccount } from 'wagmi';
import { useWalletDataStore } from '@/stores/walletDataStore';
import type { Pack } from '@/types/nft.types';

// Pack metadata aligned with traitlabold (pack-config.js) as source of truth
const PACK_METADATA: Record<string, { name: string; type: 'FLOPPY_DISC' | 'ACTION_PACK' | 'SPECIAL'; contract: string; special?: boolean }> = {
  // Floppy Discs (10000-10019) - names and contracts from traitlabold
  '10000': { name: 'Floppy 10000', type: 'FLOPPY_DISC', contract: 'OPENPACK_V4' },
  '10001': { name: 'Floppy 10001', type: 'FLOPPY_DISC', contract: 'OPENPACK_V4' },
  '10002': { name: 'Floppy 10002', type: 'FLOPPY_DISC', contract: 'OPENPACK_V4' },
  '10003': { name: 'GLITCH Floppy', type: 'FLOPPY_DISC', contract: 'OPENPACK_V4' },
  '10004': { name: 'GF Floppy', type: 'FLOPPY_DISC', contract: 'OPENPACK_V4' },
  '10005': { name: 'Golden Floppy', type: 'FLOPPY_DISC', contract: 'OPENPACK_V4' },
  '10006': { name: 'Floppy 10006', type: 'FLOPPY_DISC', contract: 'ADRIAN_FLOPPY_DISCS' },
  '10007': { name: 'NEONpack', type: 'FLOPPY_DISC', contract: 'ACTION_PACK_10007', special: true },
  '10008': { name: 'OPTICALpack', type: 'FLOPPY_DISC', contract: 'ACTION_PACKS' },
  '10009': { name: 'PUNKSfloppy', type: 'FLOPPY_DISC', contract: 'OPENPACK_V4' },
  '10010': { name: 'ComradesUSB', type: 'FLOPPY_DISC', contract: 'OPENPACK_V4' },
  '10011': { name: 'PACK10011', type: 'FLOPPY_DISC', contract: 'ACTION_PACKS' },
  '10012': { name: 'PACK10012', type: 'FLOPPY_DISC', contract: 'ACTION_PACKS' },
  '10013': { name: 'PACK10013', type: 'FLOPPY_DISC', contract: 'OPENPACK_V4' },
  '10014': { name: 'PACK10014', type: 'FLOPPY_DISC', contract: 'OPENPACK_V4' },
  '10015': { name: "XMAS '25 Floppy", type: 'FLOPPY_DISC', contract: 'OPENPACK_V4' },
  '10016': { name: 'PACK10016', type: 'FLOPPY_DISC', contract: 'ACTION_PACKS' },
  '10017': { name: 'PACK10017', type: 'FLOPPY_DISC', contract: 'ADRIAN_FLOPPY_DISCS' },
  '10018': { name: 'PACK10018', type: 'FLOPPY_DISC', contract: 'OPENPACK_V4' },
  '10019': { name: 'PACK10019', type: 'FLOPPY_DISC', contract: 'ACTION_PACKS' },

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
  '15010': { name: 'Back to Work', type: 'ACTION_PACK', contract: 'OPENPACK_V4' },
  '15011': { name: 'ActionPACK #12', type: 'ACTION_PACK', contract: 'ACTION_PACK' },
  '15012': { name: 'ActionPACK #13', type: 'ACTION_PACK', contract: 'ACTION_PACK' },
  '15013': { name: 'ActionPACK #14', type: 'ACTION_PACK', contract: 'ACTION_PACK' },
  '15014': { name: 'ActionPACK #15', type: 'ACTION_PACK', contract: 'ACTION_PACK' },
  '15015': { name: 'ActionPACK #16', type: 'ACTION_PACK', contract: 'ACTION_PACK' },

  // Special Packs
  '1123': { name: 'CensorPACK', type: 'SPECIAL', contract: 'ACTION_PACKS', special: true },
};

// Canonical display names — source of truth is AdrianLAB
// public/labmetadata/floppy.json. PACK_METADATA names above are placeholders
// ("Floppy 10000"); these are the real ones shown to the user.
const CANONICAL_NAMES: Record<string, string> = {
  '1123': 'CensorPack',
  '10000': 'OG Floppy',
  '10001': 'STARTER Floppy',
  '10002': 'STARTER Floppy',
  '10003': 'GLITCH Floppy',
  '10004': 'GF Floppy',
  '10005': 'GOLDEN Floppy',
  '10007': 'NEON PACK',
  '10008': 'OPTICAL PACK',
  '10009': 'PUNKS Floppy',
  '10010': 'Comrades USB',
  '10011': 'BORED Adrian',
  '10012': 'MUTANT Adrian',
  '10013': 'Hello-WEN 25',
  '10014': 'Blacklight Floppy',
  '10015': 'X-Mas-Floppy',
  '10016': 'HNY',
  '10017': 'YEAR 1',
  '10018': 'OG Reward',
  '10019': 'Claw Mac Mini',
};

// Range classification (traitlabold pack-config.js TOKEN_RANGES) so an owned
// in-range token is shown even if it's not in PACK_METADATA — the old code
// silently dropped anything missing from that table.
function classify(id: number): { type: Pack['type']; special: boolean } | null {
  if (id === 1123) return { type: 'SPECIAL', special: true };
  if (id >= 10000 && id <= 10019) return { type: 'FLOPPY_DISC', special: false };
  if (id >= 15000 && id <= 15015) return { type: 'ACTION_PACK', special: false };
  return null;
}

export function usePacks() {
  const { address } = useAccount();
  const rawERC1155Tokens = useWalletDataStore(state => state.rawERC1155Tokens);
  const isLoadingTraits = useWalletDataStore(state => state.isLoadingTraits);

  return useQuery({
    queryKey: ['packs', address],
    queryFn: () => {
      if (!address) return [];

      const packs: Pack[] = [];

      rawERC1155Tokens.forEach((nft) => {
        const balance = parseInt(nft.balance || '0');
        if (balance === 0) return;

        const id = Number(nft.tokenId);
        const cls = classify(id);
        if (!cls) return; // not a pack/floppy id range

        const packConfig = PACK_METADATA[nft.tokenId];
        const name =
          CANONICAL_NAMES[nft.tokenId] ||
          packConfig?.name ||
          (cls.type === 'ACTION_PACK' ? `Action Pack #${id}` : `Floppy #${id}`);

        packs.push({
          packId: nft.tokenId,
          name,
          type: packConfig?.type ?? cls.type,
          contract:
            packConfig?.contract ??
            (cls.type === 'ACTION_PACK' ? 'ACTION_PACKS' : 'OPENPACK_V4'),
          balance,
          metadata: nft.metadata,
          image: nft.image,
          special: packConfig?.special ?? cls.special,
        });
      });

      return packs;
    },
    // Enabled: always in demo mode (no address), or after store finishes loading
    enabled: !address || !isLoadingTraits,
    staleTime: Infinity, // Data derived from Zustand store — no Alchemy refetch needed
    refetchOnWindowFocus: false,
  });
}
