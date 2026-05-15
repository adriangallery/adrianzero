/**
 * Centralized Wallet Data Store
 * Loads ALL NFT data once from blockchain and stores in memory
 * Similar to TraitLabOLD's cache system but with Zustand
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { createPublicClient, fallback, http, parseAbi } from 'viem';
import { base } from 'viem/chains';
import { alchemyClient } from '@/lib/api/alchemy/client';
import { CONTRACT_ADDRESSES } from '@/config/contracts';
import { buildAlchemyRpcUrls } from '@/config/alchemy';
import type { AdrianZeroToken, Trait, TraitCategory } from '@/types/nft.types';

// Cache windows. Adrian Zeros are fairly stable per wallet (mints +
// trades, no auto-rotation) so 30 min is generous. Traits/ERC1155 are
// far more volatile — equip/unequip + mint/burn flows can change them
// in seconds, so 5 min keeps them reasonably fresh while still
// absorbing the typical "user clicks around the same page" pattern.
const ZEROS_TTL_MS = 30 * 60 * 1000;
const TRAITS_TTL_MS = 5 * 60 * 1000;
// Bump on schema change to invalidate persisted state on prod users.
const PERSIST_VERSION = 1;

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

// Floppy / Action / Special pack id ranges (traitlabold pack-config.js
// TOKEN_RANGES). These are NOT in traits.json, so they must be appended to
// the balanceOfBatch query explicitly or owned packs never get read.
const PACK_ID_RANGES: ReadonlyArray<readonly [number, number]> = [
  [10000, 10019],
  [15000, 15015],
  [1123, 1123],
];

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

  // Cache timestamps — used by setConnectedAddress to skip re-fetch on
  // reconnect, and by invalidate*() to force a refresh after writes.
  // Wallet address recorded alongside each so we never serve cache
  // belonging to a different wallet.
  zerosFetchedAt: number | null;
  zerosCachedFor: string | null;
  traitsFetchedAt: number | null;
  traitsCachedFor: string | null;

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
  loadAllAdrianZeros: (address: string, options?: { force?: boolean }) => Promise<void>;
  loadAllTraits: (address: string, options?: { force?: boolean }) => Promise<void>;
  /** Bust cached AdrianZero data — call after any AdrianZero mint/transfer success. */
  invalidateZeros: () => void;
  /** Bust cached trait data — call after any equip/mint/burn/transfer of a trait. */
  invalidateTraits: () => void;
  clearData: () => void;
  reset: () => void;
}

export const useWalletDataStore = create<WalletDataState>()(
  persist(
    (set, get) => ({
  // Initial state
  adrianZeros: [],
  traits: [],
  rawERC1155Tokens: [],
  traitsMetadata: null,
  zerosFetchedAt: null,
  zerosCachedFor: null,
  traitsFetchedAt: null,
  traitsCachedFor: null,
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
    // Same wallet reconnect → skip the full reload. Each loader checks
    // its own freshness, so if either slice is stale it will still
    // re-fetch silently in the background. This single guard collapses
    // the common "open multiple tabs / refresh / reconnect after a
    // brief disconnect" loop from N×Alchemy fetches into 0.
    if (current === address) {
      return;
    }
    set({ connectedAddress: address });
    if (!address) {
      get().reset();
      return;
    }
    // Different wallet (or first connect) — drop any data tied to the
    // previous wallet, then load. The loaders themselves will skip
    // re-fetch when persisted data for the same wallet is still fresh.
    if (current && current !== address) {
      get().clearData();
    }
    void get().loadAllAdrianZeros(address);
    void get().loadAllTraits(address);
  },

  invalidateZeros: () => {
    set({ zerosFetchedAt: null, zerosCachedFor: null });
    const addr = get().connectedAddress;
    if (addr) void get().loadAllAdrianZeros(addr, { force: true });
  },

  invalidateTraits: () => {
    set({ traitsFetchedAt: null, traitsCachedFor: null });
    const addr = get().connectedAddress;
    if (addr) void get().loadAllTraits(addr, { force: true });
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

  loadAllAdrianZeros: async (address, options) => {
    const force = options?.force === true;
    if (!force) {
      const { zerosFetchedAt, zerosCachedFor, adrianZeros } = get();
      const lc = address.toLowerCase();
      const fresh =
        zerosFetchedAt !== null &&
        zerosCachedFor === lc &&
        Date.now() - zerosFetchedAt < ZEROS_TTL_MS;
      if (fresh && adrianZeros.length >= 0) {
        // Hit — persisted data still in TTL window for this wallet.
        // Surface progress=100 so spinners disappear immediately.
        set({ isLoadingZeros: false, zerosProgress: 100, zerosError: null });
        return;
      }
    }
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
        zerosFetchedAt: Date.now(),
        zerosCachedFor: address.toLowerCase(),
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

  loadAllTraits: async (address, options) => {
    const force = options?.force === true;
    if (!force) {
      const { traitsFetchedAt, traitsCachedFor } = get();
      const lc = address.toLowerCase();
      const fresh =
        traitsFetchedAt !== null &&
        traitsCachedFor === lc &&
        Date.now() - traitsFetchedAt < TRAITS_TTL_MS;
      if (fresh) {
        set({ isLoadingTraits: false, traitsProgress: 100, traitsError: null });
        return;
      }
    }
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

      // Append the floppy / pack id ranges so the user's owned packs are
      // actually queried by balanceOfBatch. They aren't listed in
      // traits.json, so without this they're never read and never appear
      // in the Packs tab. Source of truth: traitlabold pack-config.js
      // TOKEN_RANGES (floppy 10000-10019, action 15000-15015, special 1123).
      const knownIds = new Set(allIds);
      for (const [lo, hi] of PACK_ID_RANGES) {
        for (let id = lo; id <= hi; id++) {
          if (!knownIds.has(id)) {
            allIds.push(id);
            knownIds.add(id);
          }
        }
      }
      allIds.sort((a, b) => a - b);

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
          const numericId = chunk[j];
          const metadata = allMetadata[tokenId];

          const isPackOrFloppy =
            (numericId >= 10000 && numericId <= 10019) ||
            (numericId >= 15000 && numericId <= 15015) ||
            numericId === 1123;

          if (!metadata) {
            // Packs/floppies aren't in traits.json. Still surface them for
            // the Packs tab (usePacks derives from rawERC1155Tokens), but
            // don't fabricate a Trait entry — packs have their own tab and
            // their image is built client-side from the id.
            if (isPackOrFloppy) {
              allRawTokens.push({ tokenId, balance: String(balance) });
            }
            continue;
          }

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
        traitsFetchedAt: Date.now(),
        traitsCachedFor: address.toLowerCase(),
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
      zerosFetchedAt: null,
      zerosCachedFor: null,
      traitsFetchedAt: null,
      traitsCachedFor: null,
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
      zerosFetchedAt: null,
      zerosCachedFor: null,
      traitsFetchedAt: null,
      traitsCachedFor: null,
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
}),
    {
      name: 'wallet-data-cache',
      version: PERSIST_VERSION,
      storage: createJSONStorage(() => localStorage),
      // Only persist data + timestamps. Loading flags / errors / progress
      // are session-state and would just confuse a fresh page open.
      // traitsMetadata is reproducible from /data/traits.json so we skip
      // it here to keep localStorage small.
      partialize: (state) => ({
        adrianZeros: state.adrianZeros,
        traits: state.traits,
        rawERC1155Tokens: state.rawERC1155Tokens,
        zerosFetchedAt: state.zerosFetchedAt,
        zerosCachedFor: state.zerosCachedFor,
        traitsFetchedAt: state.traitsFetchedAt,
        traitsCachedFor: state.traitsCachedFor,
        connectedAddress: state.connectedAddress,
      }),
    },
  ),
);

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
