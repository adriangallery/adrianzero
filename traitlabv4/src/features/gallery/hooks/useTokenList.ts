/**
 * useTokenList — fetches tokenCounter + paginated ownerOf via Multicall3
 * Returns { totalSupply, owners Map<tokenId, address>, loadPage(), ... }
 */

import { useState, useCallback, useRef, useMemo } from 'react';
import { useReadContract } from 'wagmi';
import { createPublicClient, http, encodeFunctionData, decodeFunctionResult } from 'viem';
import { base } from 'viem/chains';
import { CONTRACT_ADDRESSES } from '@/config/contracts';
import { ADRIAN_ZERO_ABI, MULTICALL3_ABI } from '@/lib/web3/abi';
import { buildAlchemyRpcUrls } from '@/config/alchemy';

const PAGE_SIZE = 25; // Reduced from 50 to avoid RPC rate limits

export interface UseTokenListReturn {
  totalSupply: number;
  owners: Map<number, string>;
  loadedCount: number;
  isLoadingSupply: boolean;
  isLoadingPage: boolean;
  hasMore: boolean;
  loadNextPage: () => void;
  error: Error | null;
}

export function useTokenList(): UseTokenListReturn {
  // Use Alchemy RPC to avoid public RPC rate limits
  const galleryClient = useMemo(() => {
    const rpcUrls = buildAlchemyRpcUrls();
    return createPublicClient({
      chain: base,
      transport: http(rpcUrls[0], { retryCount: 3, retryDelay: 1000 }),
    });
  }, []);

  const [owners, setOwners] = useState<Map<number, string>>(new Map());
  const [isLoadingPage, setIsLoadingPage] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const nextPageRef = useRef(0);

  // 1. Read tokenCounter from contract
  const { data: tokenCounterRaw, isLoading: isLoadingSupply } = useReadContract({
    address: CONTRACT_ADDRESSES.ADRIAN_ZERO as `0x${string}`,
    abi: ADRIAN_ZERO_ABI,
    functionName: 'tokenCounter',
    query: {
      staleTime: 1000 * 60 * 5,
    },
  });

  const totalSupply = tokenCounterRaw ? Number(tokenCounterRaw) : 0;
  const loadedCount = owners.size;
  const hasMore = loadedCount < totalSupply;

  // 2. Load a page of owners via Multicall3
  const loadNextPage = useCallback(async () => {
    if (!galleryClient || totalSupply === 0 || isLoadingPage) return;

    const startId = nextPageRef.current;
    if (startId >= totalSupply) return;

    setIsLoadingPage(true);
    setError(null);

    try {
      const endId = Math.min(startId + PAGE_SIZE, totalSupply);
      const calls = [];

      for (let id = startId; id < endId; id++) {
        // Token IDs are 0-based in AdrianZERO
        calls.push({
          target: CONTRACT_ADDRESSES.ADRIAN_ZERO as `0x${string}`,
          allowFailure: true,
          callData: encodeFunctionData({
            abi: ADRIAN_ZERO_ABI,
            functionName: 'ownerOf',
            args: [BigInt(id)],
          }) as `0x${string}`,
        });
      }

      const results = (await galleryClient.readContract({
        address: CONTRACT_ADDRESSES.MULTICALL3 as `0x${string}`,
        abi: MULTICALL3_ABI,
        functionName: 'aggregate3',
        args: [calls],
      })) as Array<{ success: boolean; returnData: `0x${string}` }>;

      setOwners((prev) => {
        const updated = new Map(prev);
        for (let i = 0; i < results.length; i++) {
          const tokenId = startId + i;
          if (results[i].success) {
            try {
              const decoded = decodeFunctionResult({
                abi: ADRIAN_ZERO_ABI,
                functionName: 'ownerOf',
                data: results[i].returnData,
              });
              updated.set(tokenId, decoded as string);
            } catch {
              // Token may not exist (burned) — skip
            }
          }
        }
        return updated;
      });

      nextPageRef.current = endId;
    } catch (err) {
      console.error('Failed to load token owners:', err);
      setError(err instanceof Error ? err : new Error('Failed to load owners'));
    } finally {
      setIsLoadingPage(false);
    }
  }, [galleryClient, totalSupply, isLoadingPage]);

  return {
    totalSupply,
    owners,
    loadedCount,
    isLoadingSupply,
    isLoadingPage,
    hasMore,
    loadNextPage,
    error,
  };
}
