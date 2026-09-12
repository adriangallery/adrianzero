/**
 * Orquesta la ejecución del plan de firmas de `lib/changes.ts#planSignatures`:
 * approval (si falta) → un `removeTrait` por cada quita → un
 * `applyTraitMultiple` con todas las altas. Publica el progreso en
 * `pendingTxStore` (sobrevive al cambio de pestaña) y usa `humanError` para
 * los mensajes de fallo (deliverable F4 #6/#7).
 *
 * Tras el éxito invalida TANTO React Query como `walletDataStore`
 * (`invalidateTraits`) — recon §8.9: la app original solo invalidaba
 * React Query y el trait aplicado seguía viéndose "disponible" hasta que
 * expiraba el TTL de 5 min del store.
 */

import { useCallback, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAccount, usePublicClient, useWriteContract } from 'wagmi';
import { CONTRACT_ADDRESSES } from '@/config/contracts';
import { ADRIAN_LAB_ABI, TRAITS_EXTENSIONS_ABI } from '@/lib/web3/abi';
import { humanError } from '@/lib/web3/humanError';
import { useWalletDataStore } from '@/stores/walletDataStore';
import { useNotifications } from '@/hooks/useNotifications';
import { planSignatures, type TraitlabChanges } from '../lib/changes';
import { usePendingTxStore } from '../store/pendingTxStore';

export interface ApplyResult {
  tokenId: string;
  lastTxHash: `0x${string}`;
}

export function useApplyTraitlabChanges(tokenId: string | null) {
  const { address } = useAccount();
  const publicClient = usePublicClient();
  const { writeContractAsync } = useWriteContract();
  const queryClient = useQueryClient();
  const invalidateTraits = useWalletDataStore((s) => s.invalidateTraits);
  const notifications = useNotifications();
  const pendingTx = usePendingTxStore();
  const [needsApproval, setNeedsApproval] = useState(true);

  const checkApproval = useCallback(async () => {
    if (!address || !publicClient) return true;
    const isApproved = (await publicClient.readContract({
      address: CONTRACT_ADDRESSES.ADRIAN_LAB as `0x${string}`,
      abi: ADRIAN_LAB_ABI,
      functionName: 'isApprovedForAll',
      args: [address, CONTRACT_ADDRESSES.TRAITS_EXTENSIONS],
    })) as boolean;
    setNeedsApproval(!isApproved);
    return !isApproved;
  }, [address, publicClient]);

  const mutation = useMutation({
    mutationFn: async (changes: TraitlabChanges): Promise<ApplyResult> => {
      if (!address || !publicClient || !tokenId) {
        throw new Error('Wallet not connected');
      }

      const approvalNeeded = await checkApproval();
      const plan = planSignatures(changes, approvalNeeded);
      if (plan.steps.length === 0) {
        throw new Error('No changes to apply');
      }

      pendingTx.start(tokenId, plan.signatureCount);
      let lastHash: `0x${string}` | null = null;

      try {
        for (let i = 0; i < plan.steps.length; i++) {
          pendingTx.setStep(i + 1);
          const step = plan.steps[i];

          if (step.type === 'approval') {
            const hash = await writeContractAsync({
              address: CONTRACT_ADDRESSES.ADRIAN_LAB as `0x${string}`,
              abi: ADRIAN_LAB_ABI,
              functionName: 'setApprovalForAll',
              args: [CONTRACT_ADDRESSES.TRAITS_EXTENSIONS, true],
            });
            await publicClient.waitForTransactionReceipt({ hash });
            lastHash = hash;
          } else if (step.type === 'remove') {
            const hash = await writeContractAsync({
              address: CONTRACT_ADDRESSES.TRAITS_EXTENSIONS as `0x${string}`,
              abi: TRAITS_EXTENSIONS_ABI,
              functionName: 'removeTrait',
              args: [BigInt(tokenId), BigInt(step.traitId)],
            });
            await publicClient.waitForTransactionReceipt({ hash });
            lastHash = hash;
          } else {
            const hash = await writeContractAsync({
              address: CONTRACT_ADDRESSES.TRAITS_EXTENSIONS as `0x${string}`,
              abi: TRAITS_EXTENSIONS_ABI,
              functionName: 'applyTraitMultiple',
              args: [BigInt(tokenId), step.traitIds.map((id) => BigInt(id))],
            });
            await publicClient.waitForTransactionReceipt({ hash });
            lastHash = hash;
          }
        }
      } finally {
        pendingTx.clear();
      }

      if (!lastHash) throw new Error('No transaction was sent');
      return { tokenId, lastTxHash: lastHash };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adrianzero-tokens'] });
      queryClient.invalidateQueries({ queryKey: ['traits'] });
      invalidateTraits();
    },
    onError: (error) => {
      pendingTx.clear();
      notifications.error('Could not apply changes', humanError(error), false);
    },
  });

  return { ...mutation, needsApproval, checkApproval };
}
