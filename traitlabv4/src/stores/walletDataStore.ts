/**
 * Centralized Wallet Data Store
 * Loads ALL NFT data once from blockchain and stores in memory
 * Similar to TraitLabOLD's cache system but with Zustand
 */

import { create } from 'zustand';
import { createPublicClient, fallback, http, parseAbi } from 'viem';
import { base } from 'viem/chains';
import { alchemyClient } from '@/lib/api/alchemy/client';
import { CONTRACT_ADDRESSES } from '@/config/contracts';
import { buildAlchemyRpcUrls } from '@/config/alchemy';
import type { AdrianZeroToken, Trait, TraitCategory } from '@/types/nft.types';

// Public Base RPC client for direct on-chain balance queries. We bypass Alchemy's
// NFT API for ERC-1155 trait balances because it silently filters out a large
// portion of holdings (spam/airdrop heuristics) — confirmed 2026-04-26 when
// Alchemy returned ~17 traits while balanceOfBatch returned 333 on the same wallet.
const ERC1155_ABI = parseAbi([
  'function balanceOfBatch(address[] accounts, uint256[] ids) view returns (uint256[])',
]);
const TSHIT_STATS_ABI = parseAbi([
  'function tshitStats() view returns (uint256 totalMinted, uint256 totalZeroBurned, uint256 nextId, uint256 idsRemaining)',
]);
const BATCH_CHUNK_SIZE = 500;

// Studio T-Shit token range — 1/1 user-minted designs in the AdrianTraitsCore
// ERC1155. They aren't listed in /data/traits.json (the design URLs live
// on-chain via tshitGetDesignURI), so we inject synthetic metadata for any
// minted ID in [STUDIO_TSHIT_MIN_ID, nextId-1] before running balanceOfBatch.
const STUDIO_TSHIT_MIN_ID = 30014;
const STUDIO_TSHIT_MAX_ID = 35000;

interface TraitMetadata {
  tokenId: string;
  name: string;
  category: TraitCategory;
  fileName: string;
  maxSupply: number;
  rarity?: 'common' | 'rare' | 'epic' | 'legendary';
}

/** Raw ERC1155 token from Alchemy — stored so usePacks/useSerums can derive without extra API calls */
export interface RawERC1155Token {
  tokenId: string;
  balance: string;
  name?: string;
  image?: {
    cachedUrl?: string;
    thumbnailUrl?: string;
    originalUrl?: string;
  };
  metadata?: any;
}

interface WalletDataState {
  // Data
  adrianZeros: AdrianZeroToken[];
  traits: Trait[];
  rawERC1155Tokens: RawERC1155Token[];
  traitsMetadata: Record<string, TraitMetadata> | null;

  // Loading states
  isLoadingZeros: boolean;
  isLoadingTraits: boolean;
  isLoadingMetadata: boolean;

  // Progress tracking
  zerosProgress: number;
  traitsProgress: number;

  // Errors
  zerosError: Error | null;
  traitsError: Error | null;

  // Connected address
  connectedAddress: string | null;

  // Actions
  setConnectedAddress: (address: string | null) => void;
  loadTraitsMetadata: () => Promise<void>;
  loadAllAdrianZeros: (address: string) => Promise<void>;
  loadAllTraits: (address: string) => Promise<void>;
  clearData: () => void;
  reset: () => void;
}

export const useWalletDataStore = create<WalletDataState>((set, get) => ({
  // Initial state
  adrianZeros: [],
  traits: [],
  rawERC1155Tokens: [],
  traitsMetadata: null,
  isLoadingZeros: false,
  isLoadingTraits: false,
  isLoadingMetadata: false,
  zerosProgress: 0,
  traitsProgress: 0,
  zerosError: null,
  traitsError: null,
  connectedAddress: null,

  setConnectedAddress: (address) => {
    const current = get().connectedAddress;
    if (current !== address) {
      set({ connectedAddress: address });
      if (address) {
        // New address connected, reload all data
        get().clearData();
        get().loadAllAdrianZeros(address);
        get().loadAllTraits(address);
      } else {
        // Disconnected
        get().reset();
      }
    }
  },

  loadTraitsMetadata: async () => {
    if (get().traitsMetadata) {
      // Already loaded
      return;
    }

    set({ isLoadingMetadata: true });

    try {
      const [traitsJsonResponse, ogpunksJsonResponse] = await Promise.all([
        fetch('/data/traits.json'),
        fetch('/data/ogpunks.json'),
      ]);
      const traitsJson = await traitsJsonResponse.json();
      const ogpunksJson = await ogpunksJsonResponse.json();

      const traitsMetadata: Record<string, TraitMetadata> = {};
      if (traitsJson.traits && Array.isArray(traitsJson.traits)) {
        traitsJson.traits.forEach((trait: any) => {
          traitsMetadata[trait.tokenId.toString()] = {
            tokenId: trait.tokenId.toString(),
            name: trait.name,
            category: trait.category,
            fileName: trait.fileName,
            maxSupply: trait.maxSupply,
            rarity: trait.rarity,
          };
        });
      }
      if (ogpunksJson.traits && Array.isArray(ogpunksJson.traits)) {
        ogpunksJson.traits.forEach((trait: any) => {
          traitsMetadata[trait.tokenId.toString()] = {
            tokenId: trait.tokenId.toString(),
            name: trait.name,
            category: 'PUNK REWARDS',
            fileName: trait.fileName ?? trait.tokenId.toString(),
            maxSupply: trait.maxSupply,
            rarity: trait.rarity,
          };
        });
      }

      set({ traitsMetadata, isLoadingMetadata: false });
    } catch (error) {
      console.error('Error loading traits metadata:', error);
      set({ isLoadingMetadata: false });
    }
  },

  loadAllAdrianZeros: async (address) => {
    set({ isLoadingZeros: true, zerosProgress: 0, zerosError: null });

    try {
      const allTokens: AdrianZeroToken[] = [];
      let pageKey: string | undefined = undefined;
      let totalEstimate = 0;

      // Load all pages
      do {
        const response = await alchemyClient.getERC721TokensPage(address, [
          CONTRACT_ADDRESSES.ADRIAN_ZERO,
        ], pageKey);

        // Transform to our type
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

        allTokens.push(...tokens);
        totalEstimate = Math.max(totalEstimate, response.totalCount || allTokens.length);

        // Update progress
        set({
          zerosProgress: totalEstimate > 0 ? Math.round((allTokens.length / totalEstimate) * 100) : 0,
        });

        pageKey = response.pageKey;

        // Small delay to avoid rate limiting
        if (pageKey) {
          await new Promise(resolve => setTimeout(resolve, 150));
        }
      } while (pageKey);

      set({
        adrianZeros: allTokens,
        isLoadingZeros: false,
        zerosProgress: 100,
      });
    } catch (error) {
      console.error('Error loading AdrianZERO tokens:', error);
      set({
        zerosError: error as Error,
        isLoadingZeros: false,
      });
    }
  },

  loadAllTraits: async (address) => {
    if (!get().traitsMetadata) {
      await get().loadTraitsMetadata();
    }
    const allMetadata = get().traitsMetadata;
    if (!allMetadata) {
      set({ traitsError: new Error('traits metadata unavailable'), isLoadingTraits: false });
      return;
    }

    set({ isLoadingTraits: true, traitsProgress: 0, traitsError: null });

    try {
      const allIds = Object.keys(allMetadata)
        .map((s) => Number(s))
        .filter((n) => Number.isFinite(n) && n > 0)
        .sort((a, b) => a - b);

      const rpcUrls = buildAlchemyRpcUrls();
      const client = createPublicClient({
        chain: base,
        transport: fallback(rpcUrls.map((url) => http(url, { retryCount: 0 }))),
      });

      // Append the Studio T-Shit minted range so user-designed 1/1s show up in
      // the trait inventory even though they aren't listed in traits.json.
      try {
        const stats = (await client.readContract({
          address: CONTRACT_ADDRESSES.ZERO_DIAMOND as `0x${string}`,
          abi: TSHIT_STATS_ABI,
          functionName: 'tshitStats',
        })) as readonly [bigint, bigint, bigint, bigint];
        const nextId = Number(stats[2]);
        const upper = Math.min(nextId - 1, STUDIO_TSHIT_MAX_ID);
        for (let id = STUDIO_TSHIT_MIN_ID; id <= upper; id++) {
          const key = String(id);
          if (!allMetadata[key]) {
            allMetadata[key] = {
              tokenId: key,
              name: `Studio T-Shit #${id}`,
              category: 'STUDIO' as TraitCategory,
              fileName: key,
              maxSupply: 1,
            };
            allIds.push(id);
          }
        }
      } catch (err) {
        console.warn('Studio T-Shit range probe failed; skipping', err);
      }

      const allTraits: Trait[] = [];
      const allRawTokens: RawERC1155Token[] = [];
      const wallet = address as `0x${string}`;

      for (let i = 0; i < allIds.length; i += BATCH_CHUNK_SIZE) {
        const chunk = allIds.slice(i, i + BATCH_CHUNK_SIZE);
        const accounts = new Array<`0x${string}`>(chunk.length).fill(wallet);
        const ids = chunk.map((n) => BigInt(n));

        let balances: readonly bigint[];
        try {
          balances = (await client.readContract({
            address: CONTRACT_ADDRESSES.ADRIAN_LAB as `0x${string}`,
            abi: ERC1155_ABI,
            functionName: 'balanceOfBatch',
            args: [accounts, ids],
          })) as readonly bigint[];
        } catch (err) {
          console.error('balanceOfBatch failed for chunk', i, err);
          continue;
        }

        for (let j = 0; j < chunk.length; j++) {
          const balance = Number(balances[j] ?? 0n);
          if (balance === 0) continue;

          const tokenId = String(chunk[j]);
          const metadata = allMetadata[tokenId];
          if (!metadata) continue;

          const numericId = chunk[j];
          const isOgPunkReward = numericId >= 100001 && numericId <= 101003;
          const isStudioTshit = numericId >= STUDIO_TSHIT_MIN_ID && numericId <= STUDIO_TSHIT_MAX_ID;
          const githubSvgUrl = isOgPunkReward
            ? `https://raw.githubusercontent.com/adriangallery/AdrianLAB/main/public/labimages/ogpunks/${tokenId}.svg`
            : isStudioTshit
            ? `https://adrianlab.vercel.app/api/render/${tokenId}.png`
            : `https://raw.githubusercontent.com/adriangallery/adrianzero/main/traitlabv3/assets/traits/${tokenId}.svg`;
          const labimagesSvgUrl = isOgPunkReward
            ? `https://adrianlab.vercel.app/labimages/ogpunks/${tokenId}.svg`
            : isStudioTshit
            ? `https://adrianlab.vercel.app/api/render/${tokenId}.png`
            : `https://raw.githubusercontent.com/adriangallery/AdrianLAB/main/public/labimages/${tokenId}.svg`;

          allTraits.push({
            tokenId,
            name: metadata.name,
            category: metadata.category.toUpperCase(),
            fileName: metadata.fileName,
            maxSupply: metadata.maxSupply,
            balance,
            rarity: metadata.rarity,
            image: {
              cachedUrl: githubSvgUrl,
              originalUrl: labimagesSvgUrl,
              thumbnailUrl: labimagesSvgUrl,
            },
          } as Trait);

          allRawTokens.push({
            tokenId,
            balance: String(balance),
          });
        }

        set({
          traitsProgress: Math.min(100, Math.round(((i + chunk.length) / allIds.length) * 100)),
        });
      }

      set({
        traits: allTraits,
        rawERC1155Tokens: allRawTokens,
        isLoadingTraits: false,
        traitsProgress: 100,
      });
    } catch (error) {
      console.error('Error loading traits:', error);
      set({
        traitsError: error as Error,
        isLoadingTraits: false,
      });
    }
  },

  clearData: () => {
    set({
      adrianZeros: [],
      traits: [],
      rawERC1155Tokens: [],
      zerosProgress: 0,
      traitsProgress: 0,
      zerosError: null,
      traitsError: null,
    });
  },

  reset: () => {
    set({
      adrianZeros: [],
      traits: [],
      rawERC1155Tokens: [],
      traitsMetadata: null,
      isLoadingZeros: false,
      isLoadingTraits: false,
      isLoadingMetadata: false,
      zerosProgress: 0,
      traitsProgress: 0,
      zerosError: null,
      traitsError: null,
      connectedAddress: null,
    });
  },
}));

// Selectors for easy access
export const selectAdrianZeros = (state: WalletDataState) => state.adrianZeros;
export const selectTraits = (state: WalletDataState) => state.traits;
export const selectTraitsByCategory = (state: WalletDataState) => {
  return state.traits.reduce((acc, trait) => {
    const cat = trait.category;
    if (!acc[cat]) {
      acc[cat] = [];
    }
    acc[cat].push(trait);
    return acc;
  }, {} as Record<TraitCategory, Trait[]>);
};
export const selectRawERC1155Tokens = (state: WalletDataState) => state.rawERC1155Tokens;
export const selectIsLoading = (state: WalletDataState) =>
  state.isLoadingZeros || state.isLoadingTraits || state.isLoadingMetadata;
