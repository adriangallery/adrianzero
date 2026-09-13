/**
 * Valida un trait ANTES de firmar — deliverable F4 #3.
 *
 * ⚠️ 13-sep-2026 (tercera vuelta, con evidencia on-chain): NI
 * `canUserAccessTrait` NI `isTraitAvailable` sirven como filtro de
 * equipado. Las dos miden el SUMINISTRO GLOBAL de venta del trait, no si el
 * usuario puede ponérselo: para el Studio T-Shit #30015 (1/1, ya minteado)
 * devolvían `(false, "Insufficient global supply")` mientras
 * `applyTraitMultiple(365, [30015])` simulado desde la wallet del dueño
 * pasaba (gas 160 688). Adrián: «tampoco me deja equipar una que ya tenía».
 * Lo mismo le pasaría a cualquier trait agotado en la tienda.
 *
 * El único oráculo fiable es el propio contrato: aquí simulamos
 * `applyTraitMultiple(tokenId, [traitId])` desde la cuenta conectada (1
 * lectura, cacheada 30 s por (address, tokenId, traitId)). Si revierte, el
 * motivo pasa por `humanError` (ownership, exclusividad de categoría,
 * pausa…). `useApplyTraitlabChanges` invalida esta caché tras un apply.
 */

import { useCallback } from 'react';
import { usePublicClient, useAccount } from 'wagmi';
import { useQueryClient } from '@tanstack/react-query';
import { CONTRACT_ADDRESSES } from '@/config/contracts';
import { TRAITS_EXTENSIONS_ABI } from '@/lib/web3/abi';
import { humanError } from '@/lib/web3/humanError';
import { useTraitlabStore } from '../store/traitlabStore';

/** Prefijo de queryKey de React Query para el resultado cacheado de checkTrait. */
export const canApplyQueryPrefix = ['traitlab', 'can-apply'] as const;
const staleWindowMs = 30_000;

export function useCanApplyTraits(tokenId: string | null) {
  const publicClient = usePublicClient();
  const { address } = useAccount();
  const setLockedReason = useTraitlabStore((s) => s.setLockedReason);
  const queryClient = useQueryClient();

  /** Simula la aplicación real de un trait a este token desde la cuenta conectada. */
  const checkTrait = useCallback(
    async (traitId: string): Promise<{ can: boolean; reason: string }> => {
      if (!publicClient || !address || !tokenId) return { can: true, reason: '' };
      const result = await queryClient.fetchQuery({
        queryKey: [...canApplyQueryPrefix, address, tokenId, traitId],
        staleTime: staleWindowMs,
        queryFn: async (): Promise<{ can: boolean; reason: string }> => {
          try {
            await publicClient.simulateContract({
              account: address,
              address: CONTRACT_ADDRESSES.TRAITS_EXTENSIONS as `0x${string}`,
              abi: TRAITS_EXTENSIONS_ABI,
              functionName: 'applyTraitMultiple',
              args: [BigInt(tokenId), [BigInt(traitId)]],
            });
            return { can: true, reason: '' };
          } catch (error) {
            // Un fallo de RED no debe bloquear la UI (el guardián final es
            // la simulación justo antes de firmar); un REVERT sí es motivo.
            const msg = error instanceof Error ? error.message : String(error);
            if (/network|timeout|fetch|429|rate limit/i.test(msg) && !/revert/i.test(msg)) {
              return { can: true, reason: '' };
            }
            return { can: false, reason: humanError(error) };
          }
        },
      });
      setLockedReason(traitId, result.can ? null : result.reason);
      return result;
    },
    [publicClient, address, tokenId, setLockedReason, queryClient]
  );

  return { checkTrait };
}
