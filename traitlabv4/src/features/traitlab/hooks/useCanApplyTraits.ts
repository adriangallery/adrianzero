/**
 * Valida reglas del contrato con `canApplyTraits` ANTES de firmar —
 * deliverable F4 #3. Se llama en dos momentos: (a) al tocar una tarjeta,
 * para saber si esa combinación provisional es válida y, si no, cachear el
 * motivo en `traitlabStore.lockedReasons` (así la tarjeta pasa a
 * "bloqueado" tras el primer toque, recon §8: no hay forma barata de
 * precalcular el bloqueo de TODO el inventario sin miles de reads); y (b)
 * justo antes de pedir la primera firma del plan, como último guardián.
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
    async (traitId: string, finalTraitIds: string[]): Promise<{ can: boolean; reason: string }> => {
      if (!publicClient || !address || !tokenId) return { can: true, reason: '' };
      try {
        const [can, reason] = (await publicClient.readContract({
          address: CONTRACT_ADDRESSES.TRAITS_EXTENSIONS as `0x${string}`,
          abi: TRAITS_EXTENSIONS_ABI,
          functionName: 'canApplyTraits',
          args: [address, BigInt(tokenId), finalTraitIds.map((id) => BigInt(id))],
        })) as [boolean, string];
        setLockedReason(traitId, can ? null : reason || 'Not allowed for this token');
        return { can, reason };
      } catch {
        // Un fallo de lectura no debe bloquear la UI — el guardián final sigue
        // siendo el propio `canApplyTraits` justo antes de firmar.
        return { can: true, reason: '' };
      }
    },
    [publicClient, address, tokenId, setLockedReason]
  );

  /** Guardián final justo antes de la primera firma, sobre el conjunto completo de IDs deseados. */
  const checkFinal = useCallback(
    async (finalTraitIds: string[]): Promise<{ can: boolean; reason: string }> => {
      if (!publicClient || !address || !tokenId || finalTraitIds.length === 0) return { can: true, reason: '' };
      try {
        const [can, reason] = (await publicClient.readContract({
          address: CONTRACT_ADDRESSES.TRAITS_EXTENSIONS as `0x${string}`,
          abi: TRAITS_EXTENSIONS_ABI,
          functionName: 'canApplyTraits',
          args: [address, BigInt(tokenId), finalTraitIds.map((id) => BigInt(id))],
        })) as [boolean, string];
        return { can, reason };
      } catch {
        return { can: true, reason: '' };
      }
    },
    [publicClient, address, tokenId]
  );

  return { checkTrait, checkFinal };
}
