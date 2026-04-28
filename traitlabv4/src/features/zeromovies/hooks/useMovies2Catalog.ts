import { useMemo } from 'react';
import { useReadContract, useReadContracts } from 'wagmi';
import { base } from 'wagmi/chains';
import { CONTRACT_ADDRESSES } from '@/config/contracts';
import { ZERO_MOVIES_FACET_2_ABI } from '@/lib/web3/abi';
import { MOVIES_S2_MOCK } from '../data/movies2Mock';
import { useMovies2Store } from '../store/movies2Store';
import type { Movie2, Movie2RentalState } from '../types';

const ZERO_ADDR = '0x0000000000000000000000000000000000000000';
const DIAMOND = CONTRACT_ADDRESSES.ZERO_DIAMOND as `0x${string}`;

const DEFAULT_CONFIG = {
  rentPrice: 5_000,
  buyPrice: 50_000,
  gracePeriod: 7 * 86_400,
  lateFeePerDay: 1_000,
  paused: true,
};

/**
 * On-chain S2 catalog hook. Reads `getAllMovie2Ids` first, then batches a
 * `getMovie2(id)` call per id (Multicall3 via wagmi) to assemble both the
 * catalog and the rental state in two RPC round-trips.
 *
 * The local `MOVIES_S2_MOCK` is still used for client-side overlay fields
 * the contract doesn't track:
 *   - `angle` (cult/pixel/horror) — drives the card border colour
 *   - `reservedFor` ('auction' | 'budokai') — pre-launch reservation badge
 *   - `hasAnimation` — switches the cover SVG → GIF
 *
 * If the chain returns a movieId not in the local catalog (e.g. future
 * additions), it's still surfaced with sane defaults so the UI never
 * silently drops a movie.
 */
export function useMovies2Catalog() {
  const overrides = useMovies2Store((s) => s.rentalOverrides);

  const {
    data: idsRaw,
    isLoading: idsLoading,
    refetch: refetchIds,
  } = useReadContract({
    address: DIAMOND,
    abi: ZERO_MOVIES_FACET_2_ABI,
    functionName: 'getAllMovie2Ids',
    chainId: base.id,
    query: { staleTime: 60_000, refetchInterval: 60_000 },
  });

  const ids = useMemo(() => {
    const arr = (idsRaw as readonly bigint[] | undefined) ?? [];
    return arr.map((x) => Number(x));
  }, [idsRaw]);

  const movieCalls = useMemo(
    () =>
      ids.map((id) => ({
        address: DIAMOND,
        abi: ZERO_MOVIES_FACET_2_ABI,
        functionName: 'getMovie2',
        args: [BigInt(id)],
        chainId: base.id,
      })),
    [ids],
  );

  const {
    data: moviesRaw,
    isLoading: moviesLoading,
    refetch: refetchMovies,
  } = useReadContracts({
    contracts: movieCalls as any,
    query: { enabled: ids.length > 0, staleTime: 30_000, refetchInterval: 30_000 },
  });

  const { data: configRaw, refetch: refetchConfig } = useReadContract({
    address: DIAMOND,
    abi: ZERO_MOVIES_FACET_2_ABI,
    functionName: 'getMovies2Config',
    chainId: base.id,
    query: { staleTime: 60_000 },
  });

  const config = useMemo(() => {
    if (!configRaw) return DEFAULT_CONFIG;
    const tuple = configRaw as readonly [
      string, string, string,
      boolean,
      bigint,
      bigint, bigint,
      bigint, bigint,
      bigint, bigint, bigint,
    ];
    return {
      rentPrice: Number(tuple[5] / 10n ** 18n),
      buyPrice: Number(tuple[6] / 10n ** 18n),
      gracePeriod: Number(tuple[7]),
      lateFeePerDay: Number(tuple[8] / 10n ** 18n),
      paused: tuple[3],
    };
  }, [configRaw]);

  const movies = useMemo<Movie2[]>(() => {
    if (!moviesRaw || ids.length === 0) return [];
    const out: Movie2[] = [];
    for (let i = 0; i < ids.length; i++) {
      const r = moviesRaw[i];
      const id = ids[i];
      if (!r || r.status !== 'success') continue;
      const tuple = r.result as readonly [
        bigint, string, boolean, boolean, boolean, boolean, boolean, string, bigint, bigint
      ];
      const onChainName = tuple[1];
      const isMystery = tuple[2];

      const overlay = MOVIES_S2_MOCK.find((m) => m.id === id);
      out.push({
        id,
        name: overlay?.name || onChainName,
        angle: overlay?.angle ?? 'cult',
        isMystery,
        reservedFor: overlay?.reservedFor,
        hasAnimation: overlay?.hasAnimation,
      });
    }
    return out;
  }, [moviesRaw, ids]);

  const rentalMap = useMemo(() => {
    const map = new Map<number, Movie2RentalState>();
    if (!moviesRaw || ids.length === 0) return map;
    const nowSec = Math.floor(Date.now() / 1000);
    const grace = config.gracePeriod || 7 * 86_400;

    for (let i = 0; i < ids.length; i++) {
      const r = moviesRaw[i];
      const id = ids[i];
      if (!r || r.status !== 'success') continue;
      const tuple = r.result as readonly [
        bigint, string, boolean, boolean, boolean, boolean, boolean, string, bigint, bigint
      ];
      const permanent = tuple[6];
      const renter = (tuple[7] as string) || ZERO_ADDR;
      const rentedAt = Number(tuple[9]);

      let isOverdue = false;
      let daysOverdue = 0;
      if (!permanent && renter !== ZERO_ADDR && rentedAt > 0) {
        const overdueAt = rentedAt + grace;
        if (nowSec > overdueAt) {
          isOverdue = true;
          daysOverdue = Math.max(1, Math.floor((nowSec - overdueAt) / 86_400));
        }
      }

      const baseRental: Movie2RentalState = { permanent, renter, rentedAt, isOverdue, daysOverdue };
      const ov = overrides[id];
      map.set(id, ov ? { ...baseRental, ...ov } : baseRental);
    }
    return map;
  }, [moviesRaw, ids, overrides, config.gracePeriod]);

  const onShelf = movies.filter((m) => {
    const r = rentalMap.get(m.id);
    return r && !r.permanent && r.renter === ZERO_ADDR;
  });

  return {
    movies,
    rentalMap,
    onShelf,
    isLoading: idsLoading || moviesLoading,
    isMock: false as const,
    config,
    refetch: () => {
      refetchIds();
      refetchMovies();
      refetchConfig();
    },
  };
}
