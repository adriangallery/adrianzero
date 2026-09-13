/**
 * Valida un trait ANTES de firmar — deliverable F4 #3.
 *
 * ⚠️ 13-sep-2026: el ABI original llamaba a `canApplyTraits(user, tokenId,
 * traitIds[]) returns (bool, string reason)` — no existe en el bytecode
 * desplegado. Sustituidas por `canUserAccessTrait` e `isTraitAvailable`.
 *
 * ⚠️ HOTFIX 13-sep-2026 (producción — cada tap con wallet daba "You don't
 * have access to this trait" siempre): las llamábamos con el ORDEN DE
 * PARÁMETROS equivocado — `canUserAccessTrait(address, tokenId, traitId)`
 * e `isTraitAvailable(tokenId, traitId)` — cuando las firmas reales
 * (verificadas contra el ABI de Blockscout, ver `traitsExtensions.abi.ts`)
 * son `canUserAccessTrait(user, traitId, requiredAmount)` e
 * `isTraitAvailable(traitId, requiredAmount)`: NO llevan `tokenId`, llevan
 * `requiredAmount` (la cantidad exigida — 1n, aplicamos de uno en uno).
 * Mismo selector que la firma correcta (por eso `abiSelectors.test.ts` no
 * lo cazó), pero al leer `tokenId`/`traitId` en el hueco de
 * `requiredAmount` el contrato evaluaba una cantidad mínima absurda y
 * devolvía `(false, "Insufficient global supply")` sin revertir. Ambas
 * devuelven además `(bool, string reason)` — el ABI anterior solo
 * declaraba el bool y truncaba el motivo real del contrato, que ahora se
 * usa tal cual en vez de un texto genérico inventado aquí.
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
        const requiredAmount = 1n; // aplicamos de uno en uno
        const { canAccess, canAccessReason, isAvailable, isAvailableReason } = await queryClient.fetchQuery({
          queryKey: [...canApplyQueryPrefix, address, tokenId, traitId],
          staleTime: staleWindowMs,
          queryFn: async () => {
            const [[canAccess, canAccessReason], [isAvailable, isAvailableReason]] = await Promise.all([
              publicClient.readContract({
                address: CONTRACT_ADDRESSES.TRAITS_EXTENSIONS as `0x${string}`,
                abi: TRAITS_EXTENSIONS_ABI,
                functionName: 'canUserAccessTrait',
                args: [address, BigInt(traitId), requiredAmount],
              }) as Promise<[boolean, string]>,
              publicClient.readContract({
                address: CONTRACT_ADDRESSES.TRAITS_EXTENSIONS as `0x${string}`,
                abi: TRAITS_EXTENSIONS_ABI,
                functionName: 'isTraitAvailable',
                args: [BigInt(traitId), requiredAmount],
              }) as Promise<[boolean, string]>,
            ]);
            return { canAccess, canAccessReason, isAvailable, isAvailableReason };
          },
        });

        if (!canAccess) {
          setLockedReason(traitId, canAccessReason || "You don't have access to this trait");
          return { can: false, reason: canAccessReason || "You don't have access to this trait" };
        }
        if (!isAvailable) {
          setLockedReason(traitId, isAvailableReason || 'Not available right now');
          return { can: false, reason: isAvailableReason || 'Not available right now' };
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
