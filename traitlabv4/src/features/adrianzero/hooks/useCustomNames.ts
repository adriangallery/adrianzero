/**
 * useCustomNames Hook
 * Fetches custom names for AdrianZERO tokens from NameRegistry
 * V4.5: Batched with multicall to eliminate N sequential RPC calls
 */

import { useQuery } from '@tanstack/react-query';
import { usePublicClient } from 'wagmi';
import { CONTRACT_ADDRESSES } from '@/config/contracts';
import { NAME_REGISTRY_ABI } from '@/lib/web3/abi';

const customNamesCache = new Map<string, string | null>();

export function useCustomNames(tokenIds: string[]) {
  const publicClient = usePublicClient();

  return useQuery({
    queryKey: ['custom-names', tokenIds],
    queryFn: async () => {
      if (!publicClient || tokenIds.length === 0) {
        return {};
      }

      const missingTokenIds = tokenIds.filter((tokenId) => !customNamesCache.has(tokenId));

      if (missingTokenIds.length > 0) {
        const contractAddress = CONTRACT_ADDRESSES.ADRIAN_NAME_REGISTRY as `0x${string}`;

        // Batch all name lookups into a single multicall
        const nameCalls = missingTokenIds.map((tokenId) => ({
          address: contractAddress,
          abi: NAME_REGISTRY_ABI,
          functionName: 'getTokenName' as const,
          args: [BigInt(tokenId)],
        }));

        const results = await publicClient.multicall({
          contracts: nameCalls,
          allowFailure: true,
        });

        results.forEach((result, index) => {
          const tokenId = missingTokenIds[index];
          if (result.status === 'success') {
            customNamesCache.set(tokenId, result.result as string);
          } else {
            customNamesCache.set(tokenId, null);
          }
        });
      }

      // Convert requested tokenIds to object map from cache
      const nameMap: Record<string, string | null> = {};
      tokenIds.forEach((tokenId) => {
        nameMap[tokenId] = customNamesCache.get(tokenId) ?? null;
      });

      return nameMap;
    },
    enabled: !!publicClient && tokenIds.length > 0,
    staleTime: 1000 * 60 * 10, // 10 minutes (names change less frequently)
  });
}
