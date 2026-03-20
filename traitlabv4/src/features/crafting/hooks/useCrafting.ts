/**
 * useCrafting Hook
 * Handles trait crafting with burning mechanism
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useWriteContract, usePublicClient } from 'wagmi';
import { CONTRACT_ADDRESSES } from '@/config/contracts';
import { CRAFTING_ABI } from '@/lib/web3/abi';
import { useNotifications } from '@/hooks/useNotifications';

interface CraftParams {
  recipeId: string;
  burnIds?: string[]; // For ANY recipes
}

export function useCraftTrait() {
  const queryClient = useQueryClient();
  const { writeContractAsync } = useWriteContract();
  const publicClient = usePublicClient();
  const notifications = useNotifications();

  const mutation = useMutation({
    mutationFn: async ({ recipeId, burnIds }: CraftParams) => {
      if (!publicClient) {
        throw new Error('Public client not available');
      }

      let hash: `0x${string}`;

      if (burnIds && burnIds.length > 0) {
        // ANY recipe - try multiple function variants
        const burnIdsBigInt = burnIds.map(id => BigInt(id));
        const burnAmounts = burnIds.map(() => BigInt(1)); // Burn 1 of each

        // Try useAnyRecipe first (as per traitlabold)
        try {
          hash = await writeContractAsync({
            address: CONTRACT_ADDRESSES.ADRIAN_CRAFTING,
            abi: CRAFTING_ABI,
            functionName: 'useAnyRecipe',
            args: [BigInt(recipeId), burnIdsBigInt, burnAmounts],
          });
        } catch (error) {
          if (import.meta.env.DEV) console.log('useAnyRecipe failed, trying craftAny:', error);
          // Fallback to craftAny
          hash = await writeContractAsync({
            address: CONTRACT_ADDRESSES.ADRIAN_CRAFTING,
            abi: CRAFTING_ABI,
            functionName: 'craftAny',
            args: [BigInt(recipeId), burnIdsBigInt, burnAmounts],
          });
        }
      } else {
        // SPECIFIC recipe - try multiple function variants
        try {
          hash = await writeContractAsync({
            address: CONTRACT_ADDRESSES.ADRIAN_CRAFTING,
            abi: CRAFTING_ABI,
            functionName: 'useSpecificRecipe',
            args: [BigInt(recipeId)],
          });
        } catch (error) {
          if (import.meta.env.DEV) console.log('useSpecificRecipe failed, trying craftSpecific:', error);
          // Fallback to craftSpecific
          hash = await writeContractAsync({
            address: CONTRACT_ADDRESSES.ADRIAN_CRAFTING,
            abi: CRAFTING_ABI,
            functionName: 'craftSpecific',
            args: [BigInt(recipeId)],
          });
        }
      }

      if (import.meta.env.DEV) console.log('Craft transaction sent:', hash);

      // Wait for confirmation
      await publicClient.waitForTransactionReceipt({ hash });

      return hash;
    },
    onSuccess: (hash) => {
      if (import.meta.env.DEV) console.log('Trait crafted successfully:', hash);
      notifications.success('Trait Crafted!', 'New trait has been added to your inventory', false);
      // Invalidate queries to refresh traits and recipes
      queryClient.invalidateQueries({ queryKey: ['traits'] });
      queryClient.invalidateQueries({ queryKey: ['crafting-recipes'] });
    },
    onError: (error) => {
      console.error('Error crafting trait:', error);
      notifications.error('Crafting Failed', 'Could not craft trait. Please check you have the required ingredients.', false);
    },
  });

  return mutation;
}
