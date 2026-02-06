/**
 * useUserPunks Hook
 * Loads all AdrianPunk token IDs owned by the connected user
 * Uses batching to efficiently load large collections
 * Includes progress tracking for better UX with large wallets
 */

import { useState, useMemo } from 'react';
import { useAccount, useReadContract, usePublicClient } from 'wagmi';
import { useQuery } from '@tanstack/react-query';
import { CONTRACT_ADDRESSES } from '@/config/contracts';
import { PUNKS_ABI } from '@/lib/web3/abi';
import { detectDeviceCapabilities, getBatchSize } from '@/lib/web3/utils/deviceCapabilities';

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export interface UseUserPunksReturn {
  punkIds: number[];
  count: number;
  isLoading: boolean;
  error: Error | null;

  // Progress tracking
  progress: number;           // 0-100
  loadedCount: number;
  isLoadingBatch: boolean;
  currentBatch: number;
  totalBatches: number;
}

export function useUserPunks(): UseUserPunksReturn {
  const { address } = useAccount();
  const publicClient = usePublicClient();

  // Device capabilities for optimal batch sizing
  const capabilities = useMemo(() => detectDeviceCapabilities(), []);
  const optimalBatchSize = getBatchSize(capabilities, false);

  // Progress tracking state
  const [progress, setProgress] = useState(0);
  const [loadedCount, setLoadedCount] = useState(0);
  const [currentBatch, setCurrentBatch] = useState(0);

  // First get the balance
  const { data: balance } = useReadContract({
    address: CONTRACT_ADDRESSES.ADRIAN_PUNKS as `0x${string}`,
    abi: PUNKS_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
    },
  });

  // Then batch load all token IDs with progress tracking
  const { data: punkIds, isLoading, error } = useQuery({
    queryKey: ['user-punks', address, balance ? Number(balance) : 0],
    queryFn: async () => {
      if (!publicClient || !address || !balance) return [];

      const count = Number(balance);
      if (count === 0) {
        setProgress(100);
        setLoadedCount(0);
        setCurrentBatch(0);
        return [];
      }

      // Use device-aware batch sizing
      const batchSize = optimalBatchSize;
      const allResults: number[] = [];

      // Reset progress
      setProgress(0);
      setLoadedCount(0);
      setCurrentBatch(0);

      for (let i = 0; i < count; i += batchSize) {
        const batchEnd = Math.min(i + batchSize, count);
        const batch = [];
        const batchNum = Math.floor(i / batchSize) + 1;

        setCurrentBatch(batchNum);

        for (let j = i; j < batchEnd; j++) {
          batch.push(
            publicClient.readContract({
              address: CONTRACT_ADDRESSES.ADRIAN_PUNKS as `0x${string}`,
              abi: PUNKS_ABI,
              functionName: 'tokenOfOwnerByIndex',
              args: [address, BigInt(j)],
            })
          );
        }

        try {
          const results = await Promise.all(batch);
          allResults.push(...results.map((tokenId) => Number(tokenId)));

          // Update progress
          setLoadedCount(allResults.length);
          setProgress(Math.round((allResults.length / count) * 100));

          // Throttle between batches
          if (batchEnd < count) {
            await sleep(150);
          }
        } catch (err) {
          console.error('Error loading punk batch:', err);
          // Continue with partial results
        }
      }

      // Final progress update
      setProgress(100);
      setLoadedCount(allResults.length);

      return allResults;
    },
    enabled: !!publicClient && !!address && !!balance && Number(balance) > 0,
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  });

  const count = balance ? Number(balance) : 0;
  const totalBatches = count > 0 ? Math.ceil(count / optimalBatchSize) : 0;

  return {
    punkIds: punkIds || [],
    count,
    isLoading,
    error: error as Error | null,

    // Progress tracking
    progress: isLoading ? progress : 100,
    loadedCount: isLoading ? loadedCount : count,
    isLoadingBatch: isLoading && currentBatch > 0,
    currentBatch,
    totalBatches,
  };
}
