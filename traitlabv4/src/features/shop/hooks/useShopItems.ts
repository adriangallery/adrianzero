/**
 * useShopItems Hook
 * Fetches active shop items from the Diamond ShopFacet and enriches with metadata
 */

import { useEffect, useState } from 'react';
import { useAccount, useReadContract } from 'wagmi';
import { CONTRACT_ADDRESSES } from '@/config/contracts';
import { SHOP_FACET_ABI } from '@/lib/web3/abi';
import { getGitHubImageUrl as getBaseGitHubImageUrl, IMAGE_PATHS } from '@/config/images';

export interface ShopItem {
  assetId: number;
  priceZero: bigint;
  priceAdrian: bigint;
  quantityAvailable: number;
  sold: number;
  startTime: number;
  endTime: number;
  active: boolean;
  maxPerWallet: number;
  hasAllowlist: boolean;
  freePerWallet: number;
  freeUsedByUser: number;
  freeRemaining: number;
  isAllowlisted: boolean;
  userPurchases: number;
  effectiveBurnBps: number;
  revenueRecipient: string;
  category: 'trait' | 'floppy' | 'serum';
  name: string;
  description: string;
  imageUrl: string;
  attributes: Array<{ trait_type: string; value: string }>;
}

// Asset ID ranges for categorization
const FLOPPY_RANGE = { min: 10000, max: 20000 };
const SERUM_RANGE = { min: 262144, max: 262147 };

function categorizeItem(assetId: number): 'trait' | 'floppy' | 'serum' {
  if (assetId >= FLOPPY_RANGE.min && assetId <= FLOPPY_RANGE.max) {
    return 'floppy';
  }
  if (assetId >= SERUM_RANGE.min && assetId <= SERUM_RANGE.max) {
    return 'serum';
  }
  return 'trait';
}

// GitHub raw URL for rendered images (primary source for traits)
const GITHUB_IMAGE_BASE = 'https://raw.githubusercontent.com/adriangallery/AdrianLAB/main/rendered-images';

// Fallback image URL based on asset type (exported for onError fallback in components)
export function getFallbackImageUrl(assetId: number): string {
  // Floppies and packs (10000-20000) use GitHub labimages
  if (assetId >= 10000 && assetId <= 20000) {
    return `https://raw.githubusercontent.com/adriangallery/AdrianLAB/main/public/labimages/${assetId}.gif`;
  }
  // Serums
  if (assetId >= 262144 && assetId <= 262147) {
    return getBaseGitHubImageUrl(IMAGE_PATHS.getComponentImage(assetId, 'gif'));
  }
  // Default traits
  return getBaseGitHubImageUrl(IMAGE_PATHS.getComponentImage(assetId, 'png'));
}

// Get primary GitHub image URL (for traits only, not floppies/serums)
function getGitHubImageUrl(assetId: number): string | null {
  // Only use GitHub for regular traits (not floppies or serums)
  if (assetId >= 10000 && assetId <= 20000) return null; // Floppies
  if (assetId >= 262144 && assetId <= 262147) return null; // Serums
  return `${GITHUB_IMAGE_BASE}/${assetId}.png`;
}

// Default image URL - GitHub for traits, fallback for others
function getDefaultImageUrl(assetId: number): string {
  return getGitHubImageUrl(assetId) ?? getFallbackImageUrl(assetId);
}

// Known item names from AdrianLAB metadata (traits.json, floppy.json, serums.json)
const ITEM_NAMES: Record<number, string> = {
  // Traits
  1: 'Dark Mode',
  1044: 'MCD-Shake-S',
  1045: 'MCD-Shake-M',
  1046: 'MCD-Shake-L',
  // Floppies
  10003: 'GLITCH Floppy',
  10009: 'PUNKS Floppy',
  10010: 'Comrades USB',
  10011: 'BORED Adrian',
  10012: 'MUTANT Adrian',
  10014: 'Blacklight Floppy',
  // Packs
  262144: 'AdrianGF',
};

function getItemName(assetId: number): string {
  return ITEM_NAMES[assetId] ?? `Trait #${assetId}`;
}

export function useShopItems() {
  const { address } = useAccount();

  const { data, isLoading, error, refetch } = useReadContract({
    address: CONTRACT_ADDRESSES.ZERO_DIAMOND as `0x${string}`,
    abi: SHOP_FACET_ABI,
    functionName: 'getActiveItems',
    args: [BigInt(0), BigInt(100), (address ?? '0x0000000000000000000000000000000000000000') as `0x${string}`],
  });

  const [items, setItems] = useState<ShopItem[]>([]);

  // Process raw contract data into ShopItem array
  useEffect(() => {
    if (!data) {
      setItems([]);
      return;
    }

    const [rawItems] = data as [readonly unknown[], bigint];
    const processed: ShopItem[] = [];

    for (const raw of rawItems) {
      const item = raw as {
        assetId: bigint;
        priceZero: bigint;
        priceAdrian: bigint;
        quantityAvailable: bigint;
        sold: bigint;
        startTime: bigint;
        endTime: bigint;
        active: boolean;
        maxPerWallet: bigint;
        hasAllowlist: boolean;
        freePerWallet: bigint;
        freeUsedByUser: bigint;
        freeRemaining: bigint;
        isAllowlisted: boolean;
        userPurchases: bigint;
        effectiveBurnBps: bigint;
        revenueRecipient: string;
      };

      const assetId = Number(item.assetId);
      processed.push({
        assetId,
        priceZero: item.priceZero,
        priceAdrian: item.priceAdrian,
        quantityAvailable: Number(item.quantityAvailable),
        sold: Number(item.sold),
        startTime: Number(item.startTime),
        endTime: Number(item.endTime),
        active: item.active,
        maxPerWallet: Number(item.maxPerWallet),
        hasAllowlist: item.hasAllowlist,
        freePerWallet: Number(item.freePerWallet),
        freeUsedByUser: Number(item.freeUsedByUser),
        freeRemaining: Number(item.freeRemaining),
        isAllowlisted: item.isAllowlisted,
        userPurchases: Number(item.userPurchases),
        effectiveBurnBps: Number(item.effectiveBurnBps),
        revenueRecipient: item.revenueRecipient,
        category: categorizeItem(assetId),
        name: getItemName(assetId),
        description: '',
        imageUrl: getDefaultImageUrl(assetId),
        attributes: [],
      });
    }

    setItems(processed);
  }, [data]);

  // Group by category
  const traits = items.filter((i) => i.category === 'trait');
  const floppies = items.filter((i) => i.category === 'floppy');
  const serums = items.filter((i) => i.category === 'serum');

  return {
    items,
    traits,
    floppies,
    serums,
    isLoading,
    error,
    refetch,
  };
}
