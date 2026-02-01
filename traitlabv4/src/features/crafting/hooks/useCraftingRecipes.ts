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

interface SpecificRecipeData {
  burnIds: bigint[];
  burnAmounts: bigint[];
  outId: bigint;
  outAmount: bigint;
  active: boolean;
}

interface AnyRecipeData {
  burnTotal: bigint;
  outId: bigint;
  outAmount: bigint;
  active: boolean;
}

// Batch size for multicall requests (to avoid overwhelming the RPC)
const MULTICALL_BATCH_SIZE = 10;

// Max recipe ID to check
const MAX_RECIPE_ID = 20;

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
      const recipeIds = Array.from({ length: MAX_RECIPE_ID + 1 }, (_, i) => i);

      // Phase 1: Batch fetch all specific recipes using multicall
      const specificRecipeCalls = recipeIds.map((id) => ({
        address: CONTRACT_ADDRESSES.ADRIAN_CRAFTING as `0x${string}`,
        abi: CRAFTING_ABI,
        functionName: 'getSpecificRecipe' as const,
        args: [BigInt(id)],
      }));

      // Execute multicall in batches to avoid rate limiting
      const specificResults: (SpecificRecipeData | null)[] = [];
      for (let i = 0; i < specificRecipeCalls.length; i += MULTICALL_BATCH_SIZE) {
        const batch = specificRecipeCalls.slice(i, i + MULTICALL_BATCH_SIZE);
        try {
          const results = await publicClient.multicall({
            contracts: batch,
            allowFailure: true,
          });
          results.forEach((result) => {
            if (result.status === 'success') {
              specificResults.push(result.result as SpecificRecipeData);
            } else {
              specificResults.push(null);
            }
          });
        } catch (e) {
          console.warn('[useCraftingRecipes] Batch fetch error:', e);
          // Fill with nulls for this batch
          batch.forEach(() => specificResults.push(null));
        }
      }

      // Collect IDs of failed specific recipes to try as ANY recipes
      const failedSpecificIds: number[] = [];
      const activeSpecificRecipes: { id: number; recipe: SpecificRecipeData }[] = [];

      recipeIds.forEach((id, index) => {
        const recipe = specificResults[index];
        if (recipe && recipe.active) {
          activeSpecificRecipes.push({ id, recipe });
        } else {
          failedSpecificIds.push(id);
        }
      });

      // Phase 2: Batch fetch ANY recipes for IDs that didn't have specific recipes
      if (failedSpecificIds.length > 0) {
        const anyRecipeCalls = failedSpecificIds.map((id) => ({
          address: CONTRACT_ADDRESSES.ADRIAN_CRAFTING as `0x${string}`,
          abi: CRAFTING_ABI,
          functionName: 'getAnyRecipe' as const,
          args: [BigInt(id)],
        }));

        const anyResults: (AnyRecipeData | null)[] = [];
        for (let i = 0; i < anyRecipeCalls.length; i += MULTICALL_BATCH_SIZE) {
          const batch = anyRecipeCalls.slice(i, i + MULTICALL_BATCH_SIZE);
          try {
            const results = await publicClient.multicall({
              contracts: batch,
              allowFailure: true,
            });
            results.forEach((result) => {
              if (result.status === 'success') {
                anyResults.push(result.result as AnyRecipeData);
              } else {
                anyResults.push(null);
              }
            });
          } catch (e) {
            console.warn('[useCraftingRecipes] ANY batch fetch error:', e);
            batch.forEach(() => anyResults.push(null));
          }
        }

        // Process ANY recipes
        failedSpecificIds.forEach((id, index) => {
          const anyRecipe = anyResults[index];
          if (anyRecipe && anyRecipe.active) {
            recipes.push({
              recipeId: id.toString(),
              inputTraits: [], // ANY recipe - burn count stored separately
              outputTrait: anyRecipe.outId.toString(),
              type: 'ANY',
              burnTotal: Number(anyRecipe.burnTotal),
              isActive: true,
              isEligible: false, // Will be updated in Phase 3
            });
          }
        });
      }

      // Add specific recipes to the list
      activeSpecificRecipes.forEach(({ id, recipe }) => {
        recipes.push({
          recipeId: id.toString(),
          inputTraits: recipe.burnIds.map((burnId: bigint) => burnId.toString()),
          outputTrait: recipe.outId.toString(),
          type: 'SPECIFIC',
          isActive: true,
          isEligible: false, // Will be updated in Phase 3
        });
      });

      // Phase 3: Batch check canCraft for all active recipes (if user is connected)
      if (address && recipes.length > 0) {
        const canCraftCalls = recipes.map((recipe) => ({
          address: CONTRACT_ADDRESSES.ADRIAN_CRAFTING as `0x${string}`,
          abi: CRAFTING_ABI,
          functionName: 'canCraft' as const,
          args: [address, BigInt(recipe.recipeId)],
        }));

        const canCraftResults: ([boolean, string] | null)[] = [];
        for (let i = 0; i < canCraftCalls.length; i += MULTICALL_BATCH_SIZE) {
          const batch = canCraftCalls.slice(i, i + MULTICALL_BATCH_SIZE);
          try {
            const results = await publicClient.multicall({
              contracts: batch,
              allowFailure: true,
            });
            results.forEach((result) => {
              if (result.status === 'success') {
                canCraftResults.push(result.result as [boolean, string]);
              } else {
                canCraftResults.push(null);
              }
            });
          } catch (e) {
            console.warn('[useCraftingRecipes] canCraft batch error:', e);
            batch.forEach(() => canCraftResults.push(null));
          }
        }

        // Update eligibility
        recipes.forEach((recipe, index) => {
          const result = canCraftResults[index];
          if (result) {
            recipe.isEligible = result[0];
          }
        });
      }

      console.log('[useCraftingRecipes] Loaded recipes:', recipes.length);
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
