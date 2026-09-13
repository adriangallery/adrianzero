import { useQuery } from '@tanstack/react-query';
import { usePublicClient } from 'wagmi';
import type { Address } from 'viem';
import { CONTRACT_ADDRESSES } from '@/config/contracts';
import { usePackRegistry } from './usePackRegistry';
import type { OwnedPack } from './types';

const BALANCE_OF_BATCH_ABI = [
  {
    inputs: [
      { internalType: 'address[]', name: 'accounts', type: 'address[]' },
      { internalType: 'uint256[]', name: 'ids', type: 'uint256[]' },
    ],
    name: 'balanceOfBatch',
    outputs: [{ internalType: 'uint256[]', name: '', type: 'uint256[]' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const;

/**
 * Packs sin abrir del usuario, por balance ERC-1155 real.
 *
 * Deliberadamente independiente de `stores/walletDataStore.ts` (que
 * `features/packs` viejo usa): ese store solo tiene datos para la
 * `connectedAddress` que alguien más haya disparado con
 * `setConnectedAddress`, con su propio TTL. Este hook toma cualquier
 * `address` y hace su propio `balanceOfBatch` acotado a los packIds que
 * `usePackRegistry` acaba de demostrar que existen de verdad (catálogo +
 * rutas de apertura) — no a un rango de IDs a mano.
 */
export function useMyPacks(address: Address | undefined) {
  const publicClient = usePublicClient();
  const registry = usePackRegistry();

  const packIds = registry.data
    ? Array.from(new Set([...registry.data.catalog.map((p) => p.packId), ...Array.from(registry.data.openRoutes.keys(), (k) => BigInt(k))]))
    : [];

  const query = useQuery<OwnedPack[]>({
    queryKey: ['packs-owned', address, packIds.map(String)],
    queryFn: async () => {
      if (!publicClient || !address || packIds.length === 0 || !registry.data) return [];

      const balances = (await publicClient.readContract({
        address: CONTRACT_ADDRESSES.ADRIAN_LAB as Address,
        abi: BALANCE_OF_BATCH_ABI,
        functionName: 'balanceOfBatch',
        args: [packIds.map(() => address), packIds],
      })) as readonly bigint[];

      const owned: OwnedPack[] = [];
      packIds.forEach((packId, i) => {
        const balance = balances[i] ?? 0n;
        if (balance === 0n) return;
        const route = registry.data!.openRoutes.get(packId.toString()) ?? null;
        owned.push({
          packId,
          balance,
          openContract: route?.contract ?? null,
          openContractAddress: route?.address ?? null,
        });
      });
      return owned;
    },
    enabled: !!publicClient && !!address && !!registry.data,
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });

  return { ...query, data: query.data ?? [] };
}
