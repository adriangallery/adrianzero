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
import { PUNKS_ABI, MULTICALL3_ABI } from '@/lib/web3/abi';
import { detectDeviceCapabilities, getBatchSize } from '@/lib/web3/utils/deviceCapabilities';
import { encodeFunctionData, decodeFunctionResult } from 'viem';

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

  // Load all token IDs using Multicall3 (single RPC call like HTML original)
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

      // Reset progress
      setProgress(0);
      setLoadedCount(0);
      setCurrentBatch(1);

      try {
        // Prepare all calls for Multicall3 (like HTML original)
        const calls = [];
        for (let i = 0; i < count; i++) {
          const callData = encodeFunctionData({
            abi: PUNKS_ABI,
            functionName: 'tokenOfOwnerByIndex',
            args: [address, BigInt(i)],
          });

          calls.push({
            target: CONTRACT_ADDRESSES.ADRIAN_PUNKS as `0x${string}`,
            allowFailure: true,
            callData: callData as `0x${string}`,
          });
        }

        setProgress(25);

        // Execute single multicall (ONE RPC request for all token IDs)
        const results = await publicClient.readContract({
          address: CONTRACT_ADDRESSES.MULTICALL3 as `0x${string}`,
          abi: MULTICALL3_ABI,
          functionName: 'aggregate3',
          args: [calls],
        });

        setProgress(75);

        // Decode results
        const tokenIds: number[] = [];
        for (const result of results) {
          if (result.success) {
            try {
              const decoded = decodeFunctionResult({
                abi: PUNKS_ABI,
                functionName: 'tokenOfOwnerByIndex',
                data: result.returnData,
              });
              tokenIds.push(Number(decoded));
            } catch (err) {
              console.warn('Failed to decode token ID:', err);
            }
          }
        }

        setProgress(100);
        setLoadedCount(tokenIds.length);

        // Remove duplicates (important for React key uniqueness)
        const uniquePunkIds = Array.from(new Set(tokenIds));

        return uniquePunkIds;
      } catch (err) {
        console.error('Error loading punks with multicall:', err);
        setProgress(100);
        throw err;
      }
    },
    enabled: !!publicClient && !!address && !!balance && Number(balance) > 0,
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  });

  const count = balance ? Number(balance) : 0;
  const totalBatches = count > 0 ? 1 : 0; // Multicall uses 1 batch (single RPC call)

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
