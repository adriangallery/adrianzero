/**
 * Centralized Wallet Data Store
 * Loads ALL NFT data once from blockchain and stores in memory
 * Similar to TraitLabOLD's cache system but with Zustand
 */

import { create } from 'zustand';
import { alchemyClient } from '@/lib/api/alchemy/client';
import { CONTRACT_ADDRESSES } from '@/config/contracts';
import type { AdrianZeroToken, Trait, TraitCategory } from '@/types/nft.types';

interface TraitMetadata {
  tokenId: string;
  name: string;
  category: TraitCategory;
  fileName: string;
  maxSupply: number;
  rarity?: 'common' | 'rare' | 'epic' | 'legendary';
}

interface WalletDataState {
  // Data
  adrianZeros: AdrianZeroToken[];
  traits: Trait[];
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
      const traitsJsonResponse = await fetch('/data/traits.json');
      const traitsJson = await traitsJsonResponse.json();

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

      console.log(`✅ Loaded ${allTokens.length} AdrianZERO tokens`);
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
    const metadata = get().traitsMetadata;
    if (!metadata) {
      // Load metadata first
      await get().loadTraitsMetadata();
    }

    set({ isLoadingTraits: true, traitsProgress: 0, traitsError: null });

    try {
      const allTraits: Trait[] = [];
      const seenIds = new Set<string>();
      let pageKey: string | undefined = undefined;
      let totalEstimate = 0;

      // Load all pages
      do {
        const response = await alchemyClient.getERC1155TokensPage(address, [
          CONTRACT_ADDRESSES.ADRIAN_LAB,
        ], pageKey);

        // Transform to our type
        const traits: Trait[] = response.ownedNfts
          .map((nft) => {
            const metadata = get().traitsMetadata?.[nft.tokenId];

            if (!metadata) {
              return null;
            }

            const balance = parseInt(nft.balance || '0');
            if (balance === 0) {
              return null;
            }

            // Deduplicate
            if (seenIds.has(nft.tokenId)) {
              return null;
            }
            seenIds.add(nft.tokenId);

            const githubSvgUrl = `https://raw.githubusercontent.com/adriangallery/adrianzero/main/traitlabv3/assets/traits/${nft.tokenId}.svg`;
            const fallbackUrl = `https://adrianzero.com/traitlab/${metadata.category.toLowerCase()}/${metadata.fileName}`;

            return {
              tokenId: nft.tokenId,
              name: metadata.name,
              category: metadata.category.toUpperCase(),
              fileName: metadata.fileName,
              maxSupply: metadata.maxSupply,
              balance,
              rarity: metadata.rarity,
              metadata: nft.raw?.metadata,
              image: {
                cachedUrl: githubSvgUrl,
                originalUrl: fallbackUrl,
              },
            } as Trait;
          })
          .filter((trait): trait is Trait => trait !== null);

        allTraits.push(...traits);
        totalEstimate = Math.max(totalEstimate, response.totalCount || allTraits.length);

        // Update progress
        set({
          traitsProgress: totalEstimate > 0 ? Math.round((allTraits.length / totalEstimate) * 100) : 0,
        });

        pageKey = response.pageKey;

        // Small delay to avoid rate limiting
        if (pageKey) {
          await new Promise(resolve => setTimeout(resolve, 150));
        }
      } while (pageKey);

      console.log(`✅ Loaded ${allTraits.length} traits`);
      set({
        traits: allTraits,
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
export const selectIsLoading = (state: WalletDataState) =>
  state.isLoadingZeros || state.isLoadingTraits || state.isLoadingMetadata;
