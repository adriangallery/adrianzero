/**
 * useCraftTrait — AdrianCrafting.
 *
 * ⚠️ 14-sep-2026 (F6): antes probaba `useAnyRecipe`/`useSpecificRecipe`
 * (inexistentes en el contrato) y, ante CUALQUIER error — incluido que el
 * usuario rechazara la firma —, reintentaba con `craftAny`/`craftSpecific`,
 * lo que abría un segundo aviso de wallet. Ahora: una sola función real,
 * simulada antes de firmar, y el motivo del revert con `humanError`.
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAccount, useWriteContract, usePublicClient } from 'wagmi';
import { CONTRACT_ADDRESSES } from '@/config/contracts';
import { CRAFTING_ABI } from '@/lib/web3/abi';
import { useNotifications } from '@/hooks/useNotifications';
import { useWalletDataStore } from '@/stores/walletDataStore';
import { humanError, isUserRejection } from '@/lib/web3/humanError';

interface CraftParams {
  recipeId: string;
  burnIds?: string[]; // recetas ANY
}

export function useCraftTrait() {
  const queryClient = useQueryClient();
  const { address } = useAccount();
  const { writeContractAsync } = useWriteContract();
  const publicClient = usePublicClient();
  const notifications = useNotifications();
  const invalidateTraits = useWalletDataStore((s) => s.invalidateTraits);

  const mutation = useMutation({
    mutationFn: async ({ recipeId, burnIds }: CraftParams) => {
      if (!publicClient || !address) throw new Error('Wallet not connected');
      const contract = CONTRACT_ADDRESSES.ADRIAN_CRAFTING as `0x${string}`;

      const request =
        burnIds && burnIds.length > 0
          ? ({
              functionName: 'craftAny' as const,
              args: [BigInt(recipeId), burnIds.map((id) => BigInt(id)), burnIds.map(() => 1n)] as const,
            })
          : ({ functionName: 'craftSpecific' as const, args: [BigInt(recipeId)] as const });

      // Guardián: si revertiría (receta inactiva, faltan traits…), lo sabemos antes de firmar.
      await publicClient.simulateContract({ account: address, address: contract, abi: CRAFTING_ABI, ...request } as never);
      const hash = await writeContractAsync({ address: contract, abi: CRAFTING_ABI, ...request } as never);
      await publicClient.waitForTransactionReceipt({ hash });
      return hash;
    },
    onSuccess: () => {
      notifications.success('Trait crafted!', 'The new trait is in your inventory', false);
      queryClient.invalidateQueries({ queryKey: ['traits'] });
      queryClient.invalidateQueries({ queryKey: ['crafting-recipes'] });
      invalidateTraits();
    },
    onError: (error) => {
      if (isUserRejection(error)) return;
      notifications.error('Crafting failed', humanError(error), false);
    },
  });

  return mutation;
}
