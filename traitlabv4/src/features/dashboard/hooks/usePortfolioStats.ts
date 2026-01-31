/**
 * usePortfolioStats Hook
 * Calculate portfolio statistics
 */

import { useQuery } from '@tanstack/react-query';
import { useAccount } from 'wagmi';
import { useAdrianZeroTokens } from '@/features/adrianzero/hooks/useAdrianZeroTokens';
import { useTraits } from '@/features/traits/hooks/useTraits';
import { usePacks } from '@/features/packs/hooks/usePacks';

export interface PortfolioStats {
  totalNFTs: number;
  totalTraits: number;
  totalPacks: number;
  traitsAppliedCount: number;
  uniqueCategories: number;
}

export function usePortfolioStats() {
  const { address } = useAccount();
  const { data: nfts = [] } = useAdrianZeroTokens();
  const { data: traits = [] } = useTraits();
  const { data: packs = [] } = usePacks();

  return useQuery({
    queryKey: ['portfolio-stats', address],
    queryFn: async (): Promise<PortfolioStats> => {
      const totalNFTs = nfts.length;
      const totalTraits = traits.reduce((sum, trait) => sum + trait.balance, 0);
      const totalPacks = packs.reduce((sum, pack) => sum + pack.balance, 0);

      // Count NFTs with traits applied
      const traitsAppliedCount = nfts.filter(
        (nft) => nft.appliedTraits && nft.appliedTraits.length > 0
      ).length;

      // Count unique trait categories
      const categories = new Set(traits.map((trait) => trait.category));
      const uniqueCategories = categories.size;

      return {
        totalNFTs,
        totalTraits,
        totalPacks,
        traitsAppliedCount,
        uniqueCategories,
      };
    },
    enabled: !!address,
  });
}
