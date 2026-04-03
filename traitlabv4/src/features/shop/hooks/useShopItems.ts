/**
 * useShopItems Hook
 * Fetches active + sold-out shop items from the Diamond ShopFacet
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
  isSoldOut: boolean;
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
  if (assetId >= 10000 && assetId <= 20000) {
    return `https://raw.githubusercontent.com/adriangallery/AdrianLAB/main/public/labimages/${assetId}.gif`;
  }
  if (assetId >= 262144 && assetId <= 262147) {
    return getBaseGitHubImageUrl(IMAGE_PATHS.getComponentImage(assetId, 'gif'));
  }
  return getBaseGitHubImageUrl(IMAGE_PATHS.getComponentImage(assetId, 'png'));
}

function getGitHubImageUrl(assetId: number): string | null {
  if (assetId >= 10000 && assetId <= 20000) return null;
  if (assetId >= 262144 && assetId <= 262147) return null;
  return `${GITHUB_IMAGE_BASE}/${assetId}.png`;
}

function getDefaultImageUrl(assetId: number): string {
  return getGitHubImageUrl(assetId) ?? getFallbackImageUrl(assetId);
}

// Known item names from AdrianLAB metadata (traits.json, floppy.json, serums.json)
const ITEM_NAMES: Record<number, string> = {
  // Traits
  1: 'Dark Mode',
  150: 'OG Trait #150',
  559: 'OG Trait #559',
  736: 'Legendary #736',
  1044: 'MCD-Shake-S',
  1045: 'MCD-Shake-M',
  1046: 'MCD-Shake-L',
  // Floppies
  10000: 'Genesis Floppy',
  10003: 'GLITCH Floppy',
  10004: 'Rare Floppy',
  10005: 'Premium Floppy',
  10007: 'Pack Floppy',
  10008: 'Special Floppy',
  10009: 'PUNKS Floppy',
  10010: 'Comrades USB',
  10011: 'BORED Adrian',
  10012: 'MUTANT Adrian',
  10013: 'Event Floppy',
  10014: 'Blacklight Floppy',
  10015: 'Limited Floppy',
  // Serums / Packs
  262144: 'AdrianGF',
  262145: 'Serum Pack Alpha',
  262146: 'Serum Pack Beta',
  262147: 'Serum Pack Gamma',
};

function getItemName(assetId: number): string {
  return ITEM_NAMES[assetId] ?? `Trait #${assetId}`;
}

// Sold-out / inactive item IDs to display with SOLD OUT banner
const SOLD_OUT_IDS: bigint[] = [
  // Original v1 sold-out (migrated as inactive)
  BigInt(150), BigInt(559), BigInt(736),
  BigInt(262145), BigInt(262146), BigInt(262147),
  BigInt(10007), BigInt(10008), BigInt(10004),
  // Deactivated post-migration
  BigInt(10000), BigInt(10005), BigInt(10013), BigInt(10015),
];

type RawShopItemView = {
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

function parseRawItem(raw: unknown, forceSoldOut: boolean): ShopItem {
  const item = raw as RawShopItemView;
  const assetId = Number(item.assetId);
  const qty = Number(item.quantityAvailable);
  const sold = Number(item.sold);

  return {
    assetId,
    priceZero: item.priceZero,
    priceAdrian: item.priceAdrian,
    quantityAvailable: qty,
    sold,
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
    isSoldOut: forceSoldOut || !item.active || (qty - sold) <= 0,
  };
}

export function useShopItems() {
  const { address } = useAccount();
  const userAddr = (address ?? '0x0000000000000000000000000000000000000000') as `0x${string}`;

  // Fetch active items
  const { data: activeData, isLoading: activeLoading, error: activeError, refetch } = useReadContract({
    address: CONTRACT_ADDRESSES.ZERO_DIAMOND as `0x${string}`,
    abi: SHOP_FACET_ABI,
    functionName: 'getActiveItems',
    args: [BigInt(0), BigInt(100), userAddr],
  });

  // Fetch sold-out items
  const { data: soldOutData, isLoading: soldOutLoading } = useReadContract({
    address: CONTRACT_ADDRESSES.ZERO_DIAMOND as `0x${string}`,
    abi: SHOP_FACET_ABI,
    functionName: 'batchGetShopItems',
    args: [SOLD_OUT_IDS, userAddr],
  });

  const [items, setItems] = useState<ShopItem[]>([]);

  useEffect(() => {
    const processed: ShopItem[] = [];

    // Active items first
    if (activeData) {
      const [rawItems] = activeData as [readonly unknown[], bigint];
      for (const raw of rawItems) {
        processed.push(parseRawItem(raw, false));
      }
    }

    // Sold-out items at the end
    if (soldOutData) {
      const rawSoldOut = soldOutData as readonly unknown[];
      for (const raw of rawSoldOut) {
        const item = parseRawItem(raw, true);
        // Skip if assetId=0 (item not configured in contract)
        if (item.assetId === 0) continue;
        // Skip if already in active list
        if (processed.some((p) => p.assetId === item.assetId)) continue;
        processed.push(item);
      }
    }

    setItems(processed);
  }, [activeData, soldOutData]);

  const isLoading = activeLoading || soldOutLoading;

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
    error: activeError,
    refetch,
  };
}
