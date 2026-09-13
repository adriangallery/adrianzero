/**
 * Lee `getAllEquippedTraits(tokenId)` on-chain al abrir un token en el
 * editor — recon §8.3: "el contrato nunca se consulta antes de escribir",
 * 0 componentes llamaban a nada parecido pese a estar disponible. Sin esto
 * la app no sabía qué había puesto en el NFT.
 *
 * ⚠️ 13-sep-2026: el ABI original apuntaba a `getAppliedTraits(uint256)
 * returns (uint256[])`, que NO existe en el bytecode desplegado (causó un
 * revert en producción). La función real es
 * `getAllEquippedTraits(uint256) returns (string[] categories,
 * uint256[] traitIds)` — ya viene con la categoría, no hace falta cruzar
 * con `traitsMetadata` para saberla.
 */

import { useEffect } from 'react';
import { useReadContract } from 'wagmi';
import { CONTRACT_ADDRESSES } from '@/config/contracts';
import { TRAITS_EXTENSIONS_ABI } from '@/lib/web3/abi';
import { useTraitlabStore } from '../store/traitlabStore';
import type { CategoryEquipped } from '../lib/changes';

export function useEquippedTraits(tokenId: string | null) {
  const setEquipped = useTraitlabStore((s) => s.setEquipped);

  const { data, isLoading, error, refetch } = useReadContract({
    address: CONTRACT_ADDRESSES.TRAITS_EXTENSIONS as `0x${string}`,
    abi: TRAITS_EXTENSIONS_ABI,
    functionName: 'getAllEquippedTraits',
    args: tokenId ? [BigInt(tokenId)] : undefined,
    query: {
      enabled: Boolean(tokenId),
      staleTime: 0, // se relee tras cada apply, no queremos servir de caché de RQ
    },
  });

  useEffect(() => {
    if (!data) return;
    const [categories, traitIds] = data as readonly [readonly string[], readonly bigint[]];
    const equipped: CategoryEquipped = {};
    categories.forEach((category, i) => {
      const id = traitIds[i];
      if (category && id !== undefined) equipped[category.toUpperCase()] = id.toString();
    });
    setEquipped(equipped);
  }, [data, setEquipped]);

  const appliedTraitIds = data
    ? ((data as readonly [readonly string[], readonly bigint[]])[1] ?? []).map((id) => id.toString())
    : [];

  return { appliedTraitIds, isLoading, error, refetch };
}

/**
 * Variante de SOLO LECTURA para fuera del editor (Home móvil F8): misma
 * llamada on-chain, sin el efecto que escribe en `traitlabStore` — solo
 * TraitLab debe escribir en su store (revisión del crítico 13-sep: si la
 * Home escribía `equipped` de A mientras `selectedTokenId` era B, el store
 * quedaba incoherente y cualquier consumidor externo leería `changes` falsos).
 */
export function useEquippedTraitIds(tokenId: string | null) {
  const { data, isLoading, error } = useReadContract({
    address: CONTRACT_ADDRESSES.TRAITS_EXTENSIONS as `0x${string}`,
    abi: TRAITS_EXTENSIONS_ABI,
    functionName: 'getAllEquippedTraits',
    args: tokenId ? [BigInt(tokenId)] : undefined,
    query: { enabled: Boolean(tokenId), staleTime: 30_000 },
  });
  const appliedTraitIds = data
    ? ((data as readonly [readonly string[], readonly bigint[]])[1] ?? []).map((id) => id.toString())
    : [];
  return { appliedTraitIds, isLoading, error };
}
