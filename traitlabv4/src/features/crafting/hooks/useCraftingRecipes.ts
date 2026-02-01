/**
 * useCraftingRecipes Hook
 * Fetches crafting recipes from ADRIAN_CRAFTING contract
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

      // Try recipe IDs 0-20 (adjust max as needed)
      const maxRecipeId = 20;

      for (let recipeId = 0; recipeId <= maxRecipeId; recipeId++) {
        try {
          // Try getSpecificRecipe first
          const specificRecipe = (await publicClient.readContract({
            address: CONTRACT_ADDRESSES.ADRIAN_CRAFTING,
            abi: CRAFTING_ABI,
            functionName: 'getSpecificRecipe',
            args: [BigInt(recipeId)],
          })) as SpecificRecipeData;

          if (specificRecipe.active) {
            let isEligible = false;
            if (address) {
              const [canCraft] = (await publicClient.readContract({
                address: CONTRACT_ADDRESSES.ADRIAN_CRAFTING,
                abi: CRAFTING_ABI,
                functionName: 'canCraft',
                args: [address, BigInt(recipeId)],
              })) as [boolean, string];
              isEligible = canCraft;
            }

            recipes.push({
              recipeId: recipeId.toString(),
              inputTraits: specificRecipe.burnIds.map((id: bigint) => id.toString()),
              outputTrait: specificRecipe.outId.toString(),
              type: 'SPECIFIC',
              isActive: true,
              isEligible,
            });
            continue;
          }
        } catch (e) {
          // Try getAnyRecipe
          try {
            const anyRecipe = (await publicClient.readContract({
              address: CONTRACT_ADDRESSES.ADRIAN_CRAFTING,
              abi: CRAFTING_ABI,
              functionName: 'getAnyRecipe',
              args: [BigInt(recipeId)],
            })) as AnyRecipeData;

            if (anyRecipe.active) {
              let isEligible = false;
              if (address) {
                const [canCraft] = (await publicClient.readContract({
                  address: CONTRACT_ADDRESSES.ADRIAN_CRAFTING,
                  abi: CRAFTING_ABI,
                  functionName: 'canCraft',
                  args: [address, BigInt(recipeId)],
                })) as [boolean, string];
                isEligible = canCraft;
              }

              recipes.push({
                recipeId: recipeId.toString(),
                inputTraits: [], // ANY recipe - burn count stored separately
                outputTrait: anyRecipe.outId.toString(),
                type: 'ANY',
                burnTotal: Number(anyRecipe.burnTotal),
                isActive: true,
                isEligible,
              });
            }
          } catch (e2) {
            // Recipe doesn't exist, continue
          }
        }
      }

      console.log('[useCraftingRecipes] Loaded recipes:', recipes.length);
      return recipes;
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
