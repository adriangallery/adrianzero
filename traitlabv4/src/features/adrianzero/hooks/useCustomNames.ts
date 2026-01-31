/**
 * useCustomNames Hook
 * Fetches custom names for AdrianZERO tokens from NameRegistry
 */

import { useQuery } from '@tanstack/react-query';
import { usePublicClient } from 'wagmi';
import { CONTRACT_ADDRESSES } from '@/config/contracts';
import { NAME_REGISTRY_ABI } from '@/lib/web3/abi';

export function useCustomNames(tokenIds: string[]) {
  const publicClient = usePublicClient();

  return useQuery({
    queryKey: ['custom-names', tokenIds],
    queryFn: async () => {
      if (!publicClient || tokenIds.length === 0) {
        return {};
      }

      const namePromises = tokenIds.map(async (tokenId) => {
        try {
          const name = await publicClient.readContract({
            address: CONTRACT_ADDRESSES.ADRIAN_NAME_REGISTRY,
            abi: NAME_REGISTRY_ABI,
            functionName: 'getTokenName',
            args: [BigInt(tokenId)],
          });

          return {
            tokenId,
            name: name as string,
          };
        } catch (error) {
          console.error(`Error fetching name for token ${tokenId}:`, error);
          return {
            tokenId,
            name: null,
          };
        }
      });

      const results = await Promise.all(namePromises);

      // Convert to object map
      const nameMap: Record<string, string | null> = {};
      results.forEach((result) => {
        nameMap[result.tokenId] = result.name;
      });

      return nameMap;
    },
    enabled: !!publicClient && tokenIds.length > 0,
    staleTime: 1000 * 60 * 10, // 10 minutes (names change less frequently)
  });
}
