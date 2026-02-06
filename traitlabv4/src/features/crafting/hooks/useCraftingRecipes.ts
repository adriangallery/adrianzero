/**
 * useCraftingRecipes Hook
 * Fetches crafting recipes from ADRIAN_CRAFTING contract
 * V4.4: Optimized with multicall to avoid rate limiting
 */

import { useQuery } from '@tanstack/react-query';
import { usePublicClient, useAccount } from 'wagmi';
import { CONTRACT_ADDRESSES } from '@/config/contracts';
import { CRAFTING_ABI } from '@/lib/web3/abi';
import type { CraftingRecipe } from '@/types/nft.types';

// Match the contract's return format exactly
// interface SpecificRecipeData {
//   active: boolean;
//   burnIds: bigint[];
//   burnAmounts: bigint[];
//   outId: bigint;
//   outAmount: bigint;
// }

// interface AnyRecipeData {
//   active: boolean;
//   burnTotal: bigint;
//   outId: bigint;
//   outAmount: bigint;
// }

// Batch size for multicall requests (to avoid overwhelming the RPC)
// const MULTICALL_BATCH_SIZE = 5;

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

      const recipes: CraftingRecipe[] = [];

      console.log('[useCraftingRecipes] Testing recipe IDs:', RECIPE_IDS);

      // For each recipe ID, try BOTH specific and any recipes
      // (Same ID can have both types active)
      for (const recipeId of RECIPE_IDS) {
        // Try specific recipe
        try {
          const specificResult = await publicClient.readContract({
            address: CONTRACT_ADDRESSES.ADRIAN_CRAFTING as `0x${string}`,
            abi: CRAFTING_ABI,
            functionName: 'getSpecificRecipe',
            args: [BigInt(recipeId)],
          }) as readonly [boolean, readonly bigint[], readonly bigint[], bigint, bigint];

          console.log(`[useCraftingRecipes] Specific recipe ${recipeId}:`, specificResult);

          // Parse array return: [active, burnIds, burnAmounts, outId, outAmount]
          const [isActive, burnIds, _burnAmounts, outId, _outAmount] = specificResult;

          if (isActive) {
            recipes.push({
              recipeId: recipeId.toString(),
              inputTraits: burnIds.map((id: bigint) => id.toString()),
              outputTrait: outId.toString(),
              type: 'SPECIFIC',
              isActive: true,
              isEligible: false,
            });
            console.log(`[useCraftingRecipes] ✅ Specific recipe ${recipeId} added`);
          } else {
            console.log(`[useCraftingRecipes] ❌ Specific recipe ${recipeId} inactive`);
          }
        } catch (error: any) {
          console.log(`[useCraftingRecipes] Specific recipe ${recipeId} error:`, error.message);
        }

        // Try any recipe (same ID)
        try {
          const anyResult = await publicClient.readContract({
            address: CONTRACT_ADDRESSES.ADRIAN_CRAFTING as `0x${string}`,
            abi: CRAFTING_ABI,
            functionName: 'getAnyRecipe',
            args: [BigInt(recipeId)],
          }) as readonly [boolean, bigint, bigint, bigint];

          console.log(`[useCraftingRecipes] Any recipe ${recipeId}:`, anyResult);

          // Parse array return: [active, burnTotal, outId, outAmount]
          const [isActive, burnTotal, outId, _outAmount] = anyResult;

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
            console.log(`[useCraftingRecipes] ✅ Any recipe ${recipeId} added`);
          } else {
            console.log(`[useCraftingRecipes] ❌ Any recipe ${recipeId} inactive`);
          }
        } catch (error: any) {
          console.log(`[useCraftingRecipes] Any recipe ${recipeId} error:`, error.message);
        }

        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      // Check canCraft for each recipe if user is connected
      if (address && recipes.length > 0) {
        for (const recipe of recipes) {
          try {
            const canCraftResult = await publicClient.readContract({
              address: CONTRACT_ADDRESSES.ADRIAN_CRAFTING as `0x${string}`,
              abi: CRAFTING_ABI,
              functionName: 'canCraft',
              args: [address, BigInt(recipe.recipeId)],
            }) as [boolean, string];

            recipe.isEligible = canCraftResult[0];
          } catch (error: any) {
            console.warn(`[useCraftingRecipes] canCraft error for recipe ${recipe.recipeId}:`, error.message);
          }
        }
      }

      console.log('[useCraftingRecipes] Loaded recipes:', recipes.length);
      console.log('[useCraftingRecipes] Recipes:', recipes);
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
