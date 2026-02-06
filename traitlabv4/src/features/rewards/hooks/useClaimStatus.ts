/**
 * useClaimStatus Hook
 * Checks claim status for campaigns and punks using batch reads
 */

import { useQuery } from '@tanstack/react-query';
import { usePublicClient } from 'wagmi';
import { CONTRACT_ADDRESSES } from '@/config/contracts';
import { REWARDS_ABI } from '@/lib/web3/abi';
import { batchContractReads } from '@/lib/web3/utils/batchReads';
import type { BatchCallConfig } from '@/lib/web3/utils/batchReads';

export function useClaimStatus(campaignIds: number[], punkIds: number[]) {
  const publicClient = usePublicClient();

  const { data: claimStatus, isLoading, error } = useQuery({
    queryKey: ['rewards-claim-status', campaignIds, punkIds],
    queryFn: async () => {
      if (!publicClient || campaignIds.length === 0 || punkIds.length === 0) {
        return {};
      }

      // Create cartesian product: campaigns × punks
      const calls: BatchCallConfig[] = campaignIds.flatMap((campaignId) =>
        punkIds.map((punkId) => ({
          address: CONTRACT_ADDRESSES.REWARDS_CONTRACT as `0x${string}`,
          abi: REWARDS_ABI,
          functionName: 'hasClaimed',
          args: [BigInt(campaignId), BigInt(punkId)],
        }))
      );

      const results = await batchContractReads<boolean>(publicClient, calls, {
        batchSize: 100,
        throttleMs: 150,
      });

      // Map results back to campaign-punk pairs
      const statusMap: Record<string, boolean> = {};
      results.forEach((res, idx) => {
        const campaignIdx = Math.floor(idx / punkIds.length);
        const punkIdx = idx % punkIds.length;
        const key = `${campaignIds[campaignIdx]}-${punkIds[punkIdx]}`;
        statusMap[key] = res.success ? (res.result as boolean) : false;
      });

      return statusMap;
    },
    enabled: !!publicClient && campaignIds.length > 0 && punkIds.length > 0,
    staleTime: 1000 * 60, // 1 minute cache
  });

  return {
    claimStatus: claimStatus || {},
    isLoading,
    error,
  };
}

export function getClaimStatusKey(campaignId: number, punkId: number): string {
  return `${campaignId}-${punkId}`;
}
