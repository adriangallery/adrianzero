/**
 * useRarityAnalytics Hook
 * Analyze trait rarity distribution
 */

import { useQuery } from '@tanstack/react-query';
import { useAccount } from 'wagmi';
import { useTraits } from '@/features/traits/hooks/useTraits';
import type { Trait } from '@/types/nft.types';

export interface RarityBucket {
  label: string;
  count: number;
  traits: Trait[];
}

export interface CategoryDistribution {
  category: string;
  count: number;
}

export interface RarityAnalytics {
  rarityBuckets: RarityBucket[];
  categoryDistribution: CategoryDistribution[];
  rarestTraits: Trait[];
}

export function useRarityAnalytics() {
  const { address } = useAccount();
  const { data: traits = [] } = useTraits();

  return useQuery({
    queryKey: ['rarity-analytics', address],
    queryFn: async (): Promise<RarityAnalytics> => {
      // Group traits by rarity buckets based on maxSupply
      const buckets: RarityBucket[] = [
        { label: 'Ultra Rare (1-10)', count: 0, traits: [] },
        { label: 'Very Rare (11-50)', count: 0, traits: [] },
        { label: 'Rare (51-100)', count: 0, traits: [] },
        { label: 'Uncommon (101-500)', count: 0, traits: [] },
        { label: 'Common (500+)', count: 0, traits: [] },
      ];

      traits.forEach((trait) => {
        const supply = trait.maxSupply || 0;
        if (supply <= 10) {
          buckets[0].count += trait.balance;
          buckets[0].traits.push(trait);
        } else if (supply <= 50) {
          buckets[1].count += trait.balance;
          buckets[1].traits.push(trait);
        } else if (supply <= 100) {
          buckets[2].count += trait.balance;
          buckets[2].traits.push(trait);
        } else if (supply <= 500) {
          buckets[3].count += trait.balance;
          buckets[3].traits.push(trait);
        } else {
          buckets[4].count += trait.balance;
          buckets[4].traits.push(trait);
        }
      });

      // Category distribution
      const categoryMap = new Map<string, number>();
      traits.forEach((trait) => {
        const current = categoryMap.get(trait.category) || 0;
        categoryMap.set(trait.category, current + trait.balance);
      });

      const categoryDistribution: CategoryDistribution[] = Array.from(categoryMap.entries()).map(
        ([category, count]) => ({ category, count })
      );

      // Get 10 rarest traits (lowest maxSupply)
      const rarestTraits = [...traits]
        .sort((a, b) => (a.maxSupply || 0) - (b.maxSupply || 0))
        .slice(0, 10);

      return {
        rarityBuckets: buckets,
        categoryDistribution,
        rarestTraits,
      };
    },
    enabled: !!address && traits.length > 0,
  });
}
