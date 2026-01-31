/**
 * useCrafting Hook
 * Handles trait crafting with burning mechanism
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useWriteContract, usePublicClient } from 'wagmi';
import { CONTRACT_ADDRESSES } from '@/config/contracts';
import { CRAFTING_ABI } from '@/lib/web3/abi';

interface CraftParams {
  recipeId: string;
}

export function useCraftTrait() {
  const queryClient = useQueryClient();
  const { writeContractAsync } = useWriteContract();
  const publicClient = usePublicClient();

  const mutation = useMutation({
    mutationFn: async ({ recipeId }: CraftParams) => {
      if (!publicClient) {
        throw new Error('Public client not available');
      }

      const hash = await writeContractAsync({
        address: CONTRACT_ADDRESSES.ADRIAN_CRAFTING,
        abi: CRAFTING_ABI,
        functionName: 'craft',
        args: [BigInt(recipeId)],
      });

      console.log('Craft transaction sent:', hash);

      // Wait for confirmation
      await publicClient.waitForTransactionReceipt({ hash });

      return hash;
    },
    onSuccess: (hash) => {
      console.log('Trait crafted successfully:', hash);
      // Invalidate queries to refresh traits
      queryClient.invalidateQueries({ queryKey: ['traits'] });
    },
    onError: (error) => {
      console.error('Error crafting trait:', error);
    },
  });

  return mutation;
}
