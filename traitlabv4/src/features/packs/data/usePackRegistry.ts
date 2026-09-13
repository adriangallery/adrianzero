import { useQuery } from '@tanstack/react-query';
import { usePublicClient } from 'wagmi';
import { CHAIN_ID } from '@/config/contracts';
import { buildPackRegistry, type PackRegistry } from './packRegistry';

/**
 * Hook interno compartido por `usePackCatalog` y `useMyPacks` — un solo
 * escaneo on-chain sirve a los dos (React Query deduplica por queryKey).
 * `staleTime` largo porque el descubrimiento de IDs (la parte cara, ver
 * `logScan.ts`) casi nunca cambia; el catálogo en sí ya trae su propio
 * `minted`/`remaining`/`active` fresco de cada `buildPackRegistry()`.
 */
export function usePackRegistry() {
  const publicClient = usePublicClient();

  return useQuery<PackRegistry>({
    queryKey: ['packs-registry', CHAIN_ID],
    queryFn: async () => {
      if (!publicClient) throw new Error('Public client not available');
      return buildPackRegistry(publicClient, CHAIN_ID);
    },
    enabled: !!publicClient,
    staleTime: 5 * 60_000,
    gcTime: 60 * 60_000,
    refetchOnWindowFocus: false,
  });
}
