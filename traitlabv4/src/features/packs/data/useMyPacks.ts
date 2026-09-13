import { useQuery } from '@tanstack/react-query';
import { usePublicClient } from 'wagmi';
import type { Address } from 'viem';
import { CONTRACT_ADDRESSES } from '@/config/contracts';
import { usePackRegistry } from './usePackRegistry';
import seed from './registry.seed.json';
import type { OwnedPack } from './types';

/**
 * IDs conocidos SIN esperar al registro: el seed versionado ya trae los
 * packIds de los tres contratos. Así el balance del usuario se lee en la
 * primera pintura aunque `buildPackRegistry` (catálogo + rutas + scan
 * incremental) tarde o falle — 13-sep: Adrián, con 14 packs distintos en la
 * wallet, veía «No packs to open» porque `useMyPacks` estaba `enabled:false`
 * hasta que el registro terminara, y React Query reporta `isLoading=false`
 * en una query deshabilitada.
 */
const SEED_PACK_IDS: bigint[] = Array.from(
  new Set(
    Object.values((seed as { sources: Record<string, { packIds: string[] }> }).sources).flatMap((s) => s.packIds)
  ),
  (id) => BigInt(id)
).filter((id) => id < 10n ** 12n); // fuera los packIds espurios (una dirección colada como id)

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

  const packIds = Array.from(
    new Set([
      ...SEED_PACK_IDS,
      ...(registry.data
        ? [...registry.data.catalog.map((p) => p.packId), ...Array.from(registry.data.openRoutes.keys(), (k) => BigInt(k))]
        : []),
    ])
  );
  const routeKnown = registry.isSuccess;

  const query = useQuery<OwnedPack[]>({
    queryKey: ['packs-owned', address, packIds.map(String), routeKnown],
    queryFn: async () => {
      if (!publicClient || !address || packIds.length === 0) return [];

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
        const route = registry.data?.openRoutes.get(packId.toString()) ?? null;
        owned.push({
          packId,
          balance,
          openContract: route?.contract ?? null,
          openContractAddress: route?.address ?? null,
          routeKnown,
        });
      });
      return owned;
    },
    enabled: !!publicClient && !!address && packIds.length > 0,
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });

  return { ...query, data: query.data ?? [], registryLoading: registry.isLoading, registryError: registry.error };
}
