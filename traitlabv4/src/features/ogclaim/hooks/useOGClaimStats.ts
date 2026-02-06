/**
 * useOGClaimStats Hook
 * Loads global OG claim statistics
 */

import { useReadContract } from 'wagmi';
import { CONTRACT_ADDRESSES } from '@/config/contracts';
import { OGCLAIM_ABI } from '@/lib/web3/abi';
import type { OGClaimStats } from '../types/ogclaim.types';

const TOTAL_SUPPLY = 1000;

export function useOGClaimStats() {
  const { data: claimedCount, isLoading } = useReadContract({
    address: CONTRACT_ADDRESSES.OGCLAIM_CONTRACT as `0x${string}`,
    abi: OGCLAIM_ABI,
    functionName: 'getClaimedCount',
    query: {
      refetchInterval: 30000, // Refetch every 30 seconds
    },
  });

  const totalClaimed = claimedCount ? Number(claimedCount) : 0;
  const percentClaimed = (totalClaimed / TOTAL_SUPPLY) * 100;

  const stats: OGClaimStats = {
    totalClaimed,
    totalSupply: TOTAL_SUPPLY,
    percentClaimed,
  };

  return {
    stats,
    isLoading,
  };
}
