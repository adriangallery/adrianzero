/**
 * useShopItems Hook
 * Fetches active shop items from the contract and enriches with metadata
 */

import { useEffect, useState } from 'react';
import { useReadContract } from 'wagmi';
import { CONTRACT_ADDRESSES } from '@/config/contracts';
import { ADRIAN_SHOP_ABI } from '@/lib/web3/abi';
import { getGitHubImageUrl as getBaseGitHubImageUrl, IMAGE_PATHS } from '@/config/images';

export interface ShopItemMetadata {
  name?: string;
  description?: string;
  image?: string;
  attributes?: Array<{ trait_type: string; value: string }>;
}

export interface ShopItem {
  assetId: number;
  price: bigint;
  quantityAvailable: number;
  sold: number;
  startTime: number;
  endTime: number;
  active: boolean;
  maxPerWallet: number;
  canPurchase: boolean;
  purchaseError: string;
  hasAllowlist: boolean;
  freePerWallet: number;
  freeUsedByUser: number;
  freeRemaining: number;
  isAllowlisted: boolean;
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

const METADATA_BASE_URL = 'https://adrianlab.vercel.app/api/metadata/floppy';

// Simple in-memory cache for metadata
const metadataCache = new Map<number, ShopItemMetadata>();

async function fetchMetadata(assetId: number): Promise<ShopItemMetadata | null> {
  if (metadataCache.has(assetId)) {
    return metadataCache.get(assetId)!;
  }

  try {
    const response = await fetch(`${METADATA_BASE_URL}/${assetId}.json`, {
      mode: 'cors',
    });
    if (!response.ok) return null;
    const metadata = await response.json();
    metadataCache.set(assetId, metadata);
    return metadata;
  } catch {
    return null;
  }
}

export function useShopItems() {
  const { data, isLoading, error, refetch } = useReadContract({
    address: CONTRACT_ADDRESSES.ADRIAN_SHOP as `0x${string}`,
    abi: ADRIAN_SHOP_ABI,
    functionName: 'getActiveItems',
    args: [BigInt(0), BigInt(100)],
  });

  const [items, setItems] = useState<ShopItem[]>([]);
  const [metadataLoaded, setMetadataLoaded] = useState(false);

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
        price: bigint;
        quantityAvailable: bigint;
        sold: bigint;
        startTime: bigint;
        endTime: bigint;
        active: boolean;
        maxPerWallet: bigint;
        canPurchase: boolean;
        purchaseError: string;
        hasAllowlist: boolean;
        freePerWallet: bigint;
        freeUsedByUser: bigint;
        freeRemaining: bigint;
        isAllowlisted: boolean;
      };

      const assetId = Number(item.assetId);
      processed.push({
        assetId,
        price: item.price,
        quantityAvailable: Number(item.quantityAvailable),
        sold: Number(item.sold),
        startTime: Number(item.startTime),
        endTime: Number(item.endTime),
        active: item.active,
        maxPerWallet: Number(item.maxPerWallet),
        canPurchase: item.canPurchase,
        purchaseError: item.purchaseError,
        hasAllowlist: item.hasAllowlist,
        freePerWallet: Number(item.freePerWallet),
        freeUsedByUser: Number(item.freeUsedByUser),
        freeRemaining: Number(item.freeRemaining),
        isAllowlisted: item.isAllowlisted,
        category: categorizeItem(assetId),
        name: `Trait #${assetId}`,
        description: '',
        imageUrl: getDefaultImageUrl(assetId),
        attributes: [],
      });
    }

    setItems(processed);
    setMetadataLoaded(false);
  }, [data]);

  // Load metadata in background to enrich items with names/descriptions
  useEffect(() => {
    if (items.length === 0 || metadataLoaded) return;

    let cancelled = false;

    async function loadMetadata() {
      const updated = [...items];
      let hasUpdates = false;

      // Load metadata in batches of 5 to avoid hammering the API
      for (let i = 0; i < updated.length; i += 5) {
        if (cancelled) return;

        const batch = updated.slice(i, i + 5);
        const results = await Promise.allSettled(
          batch.map((item) => fetchMetadata(item.assetId))
        );

        for (let j = 0; j < results.length; j++) {
          const result = results[j];
          if (result.status === 'fulfilled' && result.value) {
            const meta = result.value;
            const item = updated[i + j];

            if (meta.name) {
              item.name = meta.name;
              hasUpdates = true;
            }
            if (meta.description) {
              item.description = meta.description;
            }
            // Keep GitHub images only - do not override with metadata image
            if (meta.attributes) {
              item.attributes = meta.attributes;
            }
          }
        }
      }

      if (!cancelled && hasUpdates) {
        setItems([...updated]);
      }
      if (!cancelled) {
        setMetadataLoaded(true);
      }
    }

    loadMetadata();

    return () => {
      cancelled = true;
    };
  }, [items, metadataLoaded]);

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
