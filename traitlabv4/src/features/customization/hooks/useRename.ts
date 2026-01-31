/**
 * useRename Hook
 * Rename AdrianZERO NFTs via NameRegistry
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useWriteContract, usePublicClient } from 'wagmi';
import { CONTRACT_ADDRESSES } from '@/config/contracts';
import { NAME_REGISTRY_ABI } from '@/lib/web3/abi';

export function useNamePrice() {
  const publicClient = usePublicClient();

  return useQuery({
    queryKey: ['name-price'],
    queryFn: async () => {
      if (!publicClient) return '0';

      const price = await publicClient.readContract({
        address: CONTRACT_ADDRESSES.ADRIAN_NAME_REGISTRY,
        abi: NAME_REGISTRY_ABI,
        functionName: 'namePrice',
      });

      return price.toString();
    },
    enabled: !!publicClient,
  });
}

export function useRenameToken() {
  const queryClient = useQueryClient();
  const { writeContractAsync } = useWriteContract();
  const publicClient = usePublicClient();

  const mutation = useMutation({
    mutationFn: async ({ tokenId, newName }: { tokenId: string; newName: string }) => {
      if (!publicClient) {
        throw new Error('Public client not available');
      }

      const hash = await writeContractAsync({
        address: CONTRACT_ADDRESSES.ADRIAN_NAME_REGISTRY,
        abi: NAME_REGISTRY_ABI,
        functionName: 'setTokenName',
        args: [BigInt(tokenId), newName],
      });

      await publicClient.waitForTransactionReceipt({ hash });

      return hash;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adrianzero-tokens'] });
      queryClient.invalidateQueries({ queryKey: ['custom-names'] });
    },
  });

  return mutation;
}
