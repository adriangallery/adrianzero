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
 */

import { useCallback } from 'react';
import { usePublicClient, useAccount } from 'wagmi';
import { CONTRACT_ADDRESSES } from '@/config/contracts';
import { TRAITS_EXTENSIONS_ABI } from '@/lib/web3/abi';
import { useTraitlabStore } from '../store/traitlabStore';

export function useCanApplyTraits(tokenId: string | null) {
  const publicClient = usePublicClient();
  const { address } = useAccount();
  const setLockedReason = useTraitlabStore((s) => s.setLockedReason);

  /** Comprueba un candidato a trait id contra las reglas del contrato para este token. */
  const checkTrait = useCallback(
    async (traitId: string): Promise<{ can: boolean; reason: string }> => {
      if (!publicClient || !address || !tokenId) return { can: true, reason: '' };
      try {
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
    [publicClient, address, tokenId, setLockedReason]
  );

  return { checkTrait };
}
