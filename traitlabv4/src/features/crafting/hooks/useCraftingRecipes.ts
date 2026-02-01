/**
 * useCraftingRecipes Hook
 * Fetches crafting recipes from ADRIAN_CRAFTING contract
 */

import { useQuery } from '@tanstack/react-query';
import { usePublicClient, useAccount } from 'wagmi';
import { CONTRACT_ADDRESSES } from '@/config/contracts';
import { CRAFTING_ABI } from '@/lib/web3/abi';
import type { CraftingRecipe } from '@/types/nft.types';

interface RecipeData {
  id: bigint;
  inputs: bigint[];
  output: bigint;
  active: boolean;
}

export function useCraftingRecipes() {
  const publicClient = usePublicClient();
  const { address } = useAccount();

  return useQuery({
    queryKey: ['crafting-recipes', address],
    queryFn: async () => {
      if (!publicClient) {
        throw new Error('Public client not available');
      }

      // Get all active recipe IDs
      const activeRecipeIds = (await publicClient.readContract({
        address: CONTRACT_ADDRESSES.ADRIAN_CRAFTING,
        abi: CRAFTING_ABI,
        functionName: 'getActiveRecipes',
      })) as bigint[];

      console.log('[useCraftingRecipes] Active recipe IDs:', activeRecipeIds);

      // Fetch details for each recipe
      const recipePromises = activeRecipeIds.map(async (recipeId) => {
        const recipeData = (await publicClient.readContract({
          address: CONTRACT_ADDRESSES.ADRIAN_CRAFTING,
          abi: CRAFTING_ABI,
          functionName: 'getRecipe',
          args: [recipeId],
        })) as RecipeData;

        // Check if user can craft this recipe
        let isEligible = false;
        if (address) {
          const [canCraft] = (await publicClient.readContract({
            address: CONTRACT_ADDRESSES.ADRIAN_CRAFTING,
            abi: CRAFTING_ABI,
            functionName: 'canCraft',
            args: [address, recipeId],
          })) as [boolean, string];

          isEligible = canCraft;
        }

        // Transform to CraftingRecipe type
        const recipe: CraftingRecipe = {
          recipeId: recipeData.id.toString(),
          inputTraits: recipeData.inputs.map((id) => id.toString()),
          outputTrait: recipeData.output.toString(),
          type: recipeData.inputs.length === 1 ? 'SPECIFIC' : 'ANY',
          isActive: recipeData.active,
          isEligible,
        };

        return recipe;
      });

      const recipes = await Promise.all(recipePromises);

      console.log('[useCraftingRecipes] Loaded recipes:', recipes.length);
      return recipes.filter((r) => r.isActive);
    },
    enabled: !!publicClient,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

// Hook to check if user can craft a specific recipe
export function useCanCraft(recipeId: string) {
  const publicClient = usePublicClient();
  const { address } = useAccount();

  return useQuery({
    queryKey: ['can-craft', address, recipeId],
    queryFn: async () => {
      if (!publicClient || !address) {
        return { canCraft: false, reason: 'Wallet not connected' };
      }

      const [canCraft, reason] = (await publicClient.readContract({
        address: CONTRACT_ADDRESSES.ADRIAN_CRAFTING,
        abi: CRAFTING_ABI,
        functionName: 'canCraft',
        args: [address, BigInt(recipeId)],
      })) as [boolean, string];

      return { canCraft, reason };
    },
    enabled: !!publicClient && !!address && !!recipeId,
  });
}
