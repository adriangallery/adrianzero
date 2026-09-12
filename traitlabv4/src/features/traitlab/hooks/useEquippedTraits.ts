/**
 * Lee `getAppliedTraits(tokenId)` on-chain al abrir un token en el editor —
 * recon §8.3: "el contrato nunca se consulta antes de escribir", 0
 * componentes llamaban a esta función pese a estar en el ABI. Sin esto la
 * app no sabía qué había puesto en el NFT ni podía ofrecer "quitar".
 *
 * Cruza los IDs devueltos con `traitsMetadata` (walletDataStore) para saber
 * la categoría de cada uno y poblar `traitlabStore.equipped` como
 * `Record<category, traitId>`.
 */

import { useEffect } from 'react';
import { useReadContract } from 'wagmi';
import { CONTRACT_ADDRESSES } from '@/config/contracts';
import { TRAITS_EXTENSIONS_ABI } from '@/lib/web3/abi';
import { useWalletDataStore } from '@/stores/walletDataStore';
import { useTraitlabStore } from '../store/traitlabStore';
import type { CategoryEquipped } from '../lib/changes';

export function useEquippedTraits(tokenId: string | null) {
  const traitsMetadata = useWalletDataStore((s) => s.traitsMetadata);
  const setEquipped = useTraitlabStore((s) => s.setEquipped);

  const { data, isLoading, error, refetch } = useReadContract({
    address: CONTRACT_ADDRESSES.TRAITS_EXTENSIONS as `0x${string}`,
    abi: TRAITS_EXTENSIONS_ABI,
    functionName: 'getAppliedTraits',
    args: tokenId ? [BigInt(tokenId)] : undefined,
    query: {
      enabled: Boolean(tokenId),
      staleTime: 0, // se relee tras cada apply/remove, no queremos servir de caché de RQ
    },
  });

  useEffect(() => {
    if (!data || !traitsMetadata) return;
    const equipped: CategoryEquipped = {};
    for (const raw of data as readonly bigint[]) {
      const id = raw.toString();
      const meta = traitsMetadata[id];
      const category = meta?.category?.toUpperCase();
      if (category) equipped[category] = id;
    }
    setEquipped(equipped);
  }, [data, traitsMetadata, setEquipped]);

  return {
    appliedTraitIds: ((data as readonly bigint[] | undefined) ?? []).map((id) => id.toString()),
    isLoading,
    error,
    refetch,
  };
}
