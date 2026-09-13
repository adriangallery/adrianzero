/**
 * Valida un trait ANTES de firmar — deliverable F4 #3.
 *
 * ⚠️ 13-sep-2026: el ABI original llamaba a `canApplyTraits(user, tokenId,
 * traitIds[]) returns (bool, string reason)` — no existe en el bytecode
 * desplegado. Las funciones reales son booleanas y sin motivo:
 * `canUserAccessTrait(address, tokenId, traitId) returns (bool)` (¿puede
 * este usuario aplicar este trait a este token?) e
 * `isTraitAvailable(tokenId, traitId) returns (bool)` (¿sigue disponible
 * la regla/categoría?). Como no devuelven un porqué, el motivo que se
 * cachea es nuestro (genérico mejor que inventar texto del contrato), y el
 * guardián de verdad para errores concretos (exclusividad, supply,
 * ownership) es `simulateContract` de `applyTraitMultiple` justo antes de
 * firmar (`useApplyTraitlabChanges`), cuyo revert real pasa por
 * `humanError`.
 *
 * Caché (revisión del crítico 13-sep): tocar la misma tarjeta varias veces
 * — probar, deshacer, volver a probar — antes disparaba las 2 lecturas de
 * nuevo cada vez. `queryClient.fetchQuery` cachea por (address, tokenId,
 * traitId) con `staleTime`, así que repetir el tap dentro de esa ventana
 * no vuelve a golpear el RPC. `useApplyTraitlabChanges` invalida esta
 * caché tras un apply con éxito, porque aplicar SÍ puede cambiar qué es
 * "available" para otros traits de la misma categoría.
 */

import { useCallback } from 'react';
import { usePublicClient, useAccount } from 'wagmi';
import { useQueryClient } from '@tanstack/react-query';
import { CONTRACT_ADDRESSES } from '@/config/contracts';
import { TRAITS_EXTENSIONS_ABI } from '@/lib/web3/abi';
import { useTraitlabStore } from '../store/traitlabStore';

/** Prefijo de queryKey de React Query para el resultado cacheado de checkTrait. */
export const canApplyQueryPrefix = ['traitlab', 'can-apply'] as const;
const staleWindowMs = 30_000;

export function useCanApplyTraits(tokenId: string | null) {
  const publicClient = usePublicClient();
  const { address } = useAccount();
  const setLockedReason = useTraitlabStore((s) => s.setLockedReason);
  const queryClient = useQueryClient();

  /** Comprueba un candidato a trait id contra las reglas del contrato para este token. */
  const checkTrait = useCallback(
    async (traitId: string): Promise<{ can: boolean; reason: string }> => {
      if (!publicClient || !address || !tokenId) return { can: true, reason: '' };
      try {
        const { canAccess, isAvailable } = await queryClient.fetchQuery({
          queryKey: [...canApplyQueryPrefix, address, tokenId, traitId],
          staleTime: staleWindowMs,
          queryFn: async () => {
            const [canAccess, isAvailable] = await Promise.all([
              publicClient.readContract({
                address: CONTRACT_ADDRESSES.TRAITS_EXTENSIONS as `0x${string}`,
                abi: TRAITS_EXTENSIONS_ABI,
                functionName: 'canUserAccessTrait',
                args: [address, BigInt(tokenId), BigInt(traitId)],
              }) as Promise<boolean>,
              publicClient.readContract({
                address: CONTRACT_ADDRESSES.TRAITS_EXTENSIONS as `0x${string}`,
                abi: TRAITS_EXTENSIONS_ABI,
                functionName: 'isTraitAvailable',
                args: [BigInt(tokenId), BigInt(traitId)],
              }) as Promise<boolean>,
            ]);
            return { canAccess, isAvailable };
          },
        });

        if (!canAccess) {
          setLockedReason(traitId, "You don't have access to this trait");
          return { can: false, reason: "You don't have access to this trait" };
        }
        if (!isAvailable) {
          setLockedReason(traitId, 'Not available for this token right now');
          return { can: false, reason: 'Not available for this token right now' };
        }
        setLockedReason(traitId, null);
        return { can: true, reason: '' };
      } catch {
        // Un fallo de lectura no debe bloquear la UI — el guardián final sigue
        // siendo `simulateContract` justo antes de firmar.
        return { can: true, reason: '' };
      }
    },
    [publicClient, address, tokenId, setLockedReason, queryClient]
  );

  return { checkTrait };
}
