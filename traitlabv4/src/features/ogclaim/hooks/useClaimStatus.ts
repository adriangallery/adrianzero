/**
 * useClaimStatus Hook (OGCLAIM)
 * Checks claim status for punks using batch reads
 */

import { useQuery } from '@tanstack/react-query';
import { usePublicClient } from 'wagmi';
import { CONTRACT_ADDRESSES } from '@/config/contracts';
import { OGCLAIM_ABI } from '@/lib/web3/abi';
import { batchContractReads } from '@/lib/web3/utils/batchReads';
import type { BatchCallConfig } from '@/lib/web3/utils/batchReads';

export function useClaimStatus(punkIds: number[]) {
  const publicClient = usePublicClient();

  const { data: claimStatus, isLoading, error } = useQuery({
    queryKey: ['ogclaim-status', punkIds],
    queryFn: async () => {
      if (!publicClient || punkIds.length === 0) {
        return {};
      }

      const calls: BatchCallConfig[] = punkIds.map((punkId) => ({
        address: CONTRACT_ADDRESSES.OGCLAIM_CONTRACT as `0x${string}`,
        abi: OGCLAIM_ABI,
        functionName: 'isClaimed',
        args: [BigInt(punkId)],
      }));

      const results = await batchContractReads<boolean>(publicClient, calls, {
        batchSize: 100,
        throttleMs: 150,
      });

      // Map results to punkId -> claimed status
      const statusMap: Record<number, boolean> = {};
      results.forEach((res, idx) => {
        statusMap[punkIds[idx]] = res.success ? (res.result as boolean) : false;
      });

      return statusMap;
    },
    enabled: !!publicClient && punkIds.length > 0,
    staleTime: 1000 * 60, // 1 minute cache
  });

  return {
    claimStatus: claimStatus || {},
    isLoading,
    error,
  };
}
