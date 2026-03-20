/**
 * useCraftingRecipes Hook
 * Fetches crafting recipes from ADRIAN_CRAFTING contract
 * V4.5: Batched with multicall to eliminate sequential RPC calls
 */

import { useQuery } from '@tanstack/react-query';
import { usePublicClient, useAccount } from 'wagmi';
import { CONTRACT_ADDRESSES } from '@/config/contracts';
import { CRAFTING_ABI } from '@/lib/web3/abi';
import type { CraftingRecipe } from '@/types/nft.types';

// Recipe IDs to check (based on traitlabold logic)
const RECIPE_IDS = [1, 2, 3, 4, 5];

export function useCraftingRecipes() {
  const publicClient = usePublicClient();
  const { address } = useAccount();

  return useQuery({
    queryKey: ['crafting-recipes', address],
    queryFn: async () => {
      if (!publicClient) {
        throw new Error('Public client not available');
      }

      const contractAddress = CONTRACT_ADDRESSES.ADRIAN_CRAFTING as `0x${string}`;

      // Batch all getSpecificRecipe + getAnyRecipe calls into one multicall
      const recipeCallsBatch = RECIPE_IDS.flatMap((recipeId) => [
        {
          address: contractAddress,
          abi: CRAFTING_ABI,
          functionName: 'getSpecificRecipe' as const,
          args: [BigInt(recipeId)],
        },
        {
          address: contractAddress,
          abi: CRAFTING_ABI,
          functionName: 'getAnyRecipe' as const,
          args: [BigInt(recipeId)],
        },
      ]);

      const recipeResults = await publicClient.multicall({
        contracts: recipeCallsBatch,
        allowFailure: true,
      });

      const recipes: CraftingRecipe[] = [];

      // Process results (2 per recipe ID: specific + any)
      for (let i = 0; i < RECIPE_IDS.length; i++) {
        const recipeId = RECIPE_IDS[i];
        const specificResult = recipeResults[i * 2];
        const anyResult = recipeResults[i * 2 + 1];

        // Process specific recipe
        if (specificResult.status === 'success' && specificResult.result) {
          const [isActive, burnIds, , outId] = specificResult.result as readonly [boolean, readonly bigint[], readonly bigint[], bigint, bigint];
          if (isActive) {
            recipes.push({
              recipeId: recipeId.toString(),
              inputTraits: burnIds.map((id: bigint) => id.toString()),
              outputTrait: outId.toString(),
              type: 'SPECIFIC',
              isActive: true,
              isEligible: false,
            });
          }
        }

        // Process any recipe
        if (anyResult.status === 'success' && anyResult.result) {
          const [isActive, burnTotal, outId] = anyResult.result as readonly [boolean, bigint, bigint, bigint];
          if (isActive) {
            recipes.push({
              recipeId: recipeId.toString(),
              inputTraits: [],
              outputTrait: outId.toString(),
              type: 'ANY',
              burnTotal: Number(burnTotal),
              isActive: true,
              isEligible: false,
            });
          }
        }
      }

      // Batch canCraft checks for all active recipes
      if (address && recipes.length > 0) {
        const canCraftCalls = recipes.map((recipe) => ({
          address: contractAddress,
          abi: CRAFTING_ABI,
          functionName: 'canCraft' as const,
          args: [address, BigInt(recipe.recipeId)],
        }));

        const canCraftResults = await publicClient.multicall({
          contracts: canCraftCalls,
          allowFailure: true,
        });

        canCraftResults.forEach((result, index) => {
          if (result.status === 'success' && result.result) {
            recipes[index].isEligible = (result.result as [boolean, string])[0];
          }
        });
      }

      return recipes;
    },
    enabled: !!publicClient,
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: false,
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
    staleTime: 1000 * 60, // 1 minute
  });
}
