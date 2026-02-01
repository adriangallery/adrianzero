/**
 * usePortfolioStats Hook
 * Calculate portfolio statistics
 */

import { useMemo } from 'react';
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
  const { data: nfts = [], isLoading: nftsLoading } = useAdrianZeroTokens();
  const { data: traits = [], isLoading: traitsLoading } = useTraits();
  const { data: packs = [], isLoading: packsLoading } = usePacks();

  const isLoading = nftsLoading || traitsLoading || packsLoading;

  const data = useMemo((): PortfolioStats => {
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
  }, [nfts, traits, packs]);

  return {
    data: address ? data : undefined,
    isLoading,
  };
}
