import {useMemo} from 'react';
import {useReadContract, useReadContracts} from 'wagmi';
import {base} from 'wagmi/chains';
import {formatEther} from 'viem';
import {CONTRACT_ADDRESSES} from '@/config/contracts';
import {SAMURAI_DOJO_ABI, BUDOKAI_STATUS} from '@/lib/web3/abi';
import type {BudokaiInfo, Champions} from '../types';

/**
 * Pin every dojo read to Base. Without this, if the user's wallet is connected to a
 * different chain (e.g. Ethereum mainnet), wagmi routes reads to that chain, where the
 * Diamond address doesn't exist → reads silently return 0 → UI shows "BUDOKAI —" / "SOON"
 * even when Budokai is live. Fixed 2026-04-24 after production regression.
 */
const DOJO_CHAIN_ID = base.id;

/**
 * Adaptive polling helper. When the current Budokai is Resolved nothing on-chain changes
 * until the next one opens, so polling at 15s/30s burns RPC for nothing. Returning `false`
 * disables the interval — the queries still refetch on window focus (see `useBudokaiInfo`).
 *
 * `Resolving` polls fast (about to flip to Resolved). Other states use the default cadence.
 */
export function dojoPollInterval(status: number | undefined, base: number): number | false {
    if (status === BUDOKAI_STATUS.Resolved) return false;
    if (status === BUDOKAI_STATUS.Resolving) return Math.min(base, 5_000);
    return base;
}

/**
 * Reads the currently-open Budokai ID (0 if none configured).
 */
export function useCurrentBudokaiId() {
    const {data, refetch, isLoading} = useReadContract({
        address: CONTRACT_ADDRESSES.ZERO_DIAMOND as `0x${string}`,
        abi: SAMURAI_DOJO_ABI,
        functionName: 'getCurrentBudokaiId',
        chainId: DOJO_CHAIN_ID,
        query: {refetchInterval: 30_000, refetchOnWindowFocus: true},
    });
    return {
        currentBudokaiId: data ? Number(data) : 0,
        refetch,
        isLoading,
    };
}

/**
 * Reads full info for a given Budokai ID.
 * Call this with the result of `useCurrentBudokaiId`.
 */
export function useBudokaiInfo(budokaiId: number | undefined): {
    info: BudokaiInfo | null;
    refetch: () => void;
    isLoading: boolean;
} {
    const {data, refetch, isLoading} = useReadContract({
        address: CONTRACT_ADDRESSES.ZERO_DIAMOND as `0x${string}`,
        abi: SAMURAI_DOJO_ABI,
        functionName: 'getBudokaiInfo',
        args: budokaiId !== undefined ? [BigInt(budokaiId)] : undefined,
        chainId: DOJO_CHAIN_ID,
        query: {enabled: budokaiId !== undefined, refetchInterval: 15_000, refetchOnWindowFocus: true},
    });

    if (!data || budokaiId === undefined) {
        return {info: null, refetch, isLoading};
    }

    const [seed, pool, entryStart, entryEnd, resolveBlock, minEntries, status, entryCount] = data as [
        bigint,
        bigint,
        bigint,
        bigint,
        bigint,
        number,
        number,
        bigint,
    ];

    return {
        info: {
            id: budokaiId,
            seed,
            pool,
            entryStart: Number(entryStart),
            entryEnd: Number(entryEnd),
            resolveBlock,
            minEntries: Number(minEntries),
            status: status as BudokaiInfo['status'],
            entryCount: Number(entryCount),
        },
        refetch,
        isLoading,
    };
}

/**
 * Reads the full list of tokenIds entered in a given Budokai.
 *
 * `entries` is memoized off `data` — without this, every parent render returns a new array
 * reference, which busts every downstream `useMemo`/`useEffect` that depends on it (notably
 * the visibleTokenIds → contracts list in `useSamuraiState`, which would needlessly rebuild
 * the multicall list and re-fire the query).
 *
 * `pollMs` is plumbed from the parent so we can pause polling once the Budokai is Resolved.
 */
export function useBudokaiEntries(budokaiId: number | undefined, pollMs?: number | false) {
    const {data, refetch, isLoading} = useReadContract({
        address: CONTRACT_ADDRESSES.ZERO_DIAMOND as `0x${string}`,
        abi: SAMURAI_DOJO_ABI,
        functionName: 'getEntries',
        args: budokaiId !== undefined ? [BigInt(budokaiId)] : undefined,
        chainId: DOJO_CHAIN_ID,
        query: {
            enabled: budokaiId !== undefined,
            refetchInterval: pollMs === undefined ? 15_000 : pollMs,
            refetchOnWindowFocus: true,
        },
    });

    const entries = useMemo(
        () => ((data as bigint[] | undefined) ?? []).map((id) => Number(id)),
        [data],
    );
    return {entries, refetch, isLoading};
}

/**
 * Reads podium info (champion, runner-up, 2 semifinalists, 4 quarterfinalists)
 * for a Budokai. Only meaningful once status == Resolved.
 */
export function useChampions(budokaiId: number | undefined): {
    champions: Champions | null;
    refetch: () => void;
} {
    const {data, refetch} = useReadContract({
        address: CONTRACT_ADDRESSES.ZERO_DIAMOND as `0x${string}`,
        abi: SAMURAI_DOJO_ABI,
        functionName: 'getChampions',
        args: budokaiId !== undefined ? [BigInt(budokaiId)] : undefined,
        chainId: DOJO_CHAIN_ID,
        query: {enabled: budokaiId !== undefined},
    });

    if (!data || budokaiId === undefined) return {champions: null, refetch};

    const [champion, runnerUp, semis, quarters] = data as [
        bigint,
        bigint,
        readonly [bigint, bigint],
        readonly [bigint, bigint, bigint, bigint],
    ];

    return {
        champions: {
            champion: Number(champion),
            runnerUp: Number(runnerUp),
            semifinalists: [Number(semis[0]), Number(semis[1])],
            quarterfinalists: [
                Number(quarters[0]),
                Number(quarters[1]),
                Number(quarters[2]),
                Number(quarters[3]),
            ],
        },
        refetch,
    };
}

/**
 * Derives a human-readable phase label for UI.
 */
export function phaseLabel(status: number | undefined, now: number, info: BudokaiInfo | null): string {
    if (!info || status === undefined) return 'LOADING';
    if (status === BUDOKAI_STATUS.Unconfigured) return 'SOON';
    if (status === BUDOKAI_STATUS.Open) {
        if (now < info.entryStart) return 'OPENS SOON';
        if (now > info.entryEnd) return 'ENTRY CLOSED';
        return 'ENTRY OPEN';
    }
    if (status === BUDOKAI_STATUS.Closed) return 'AWAITING RESOLVE';
    if (status === BUDOKAI_STATUS.Resolving) return 'RESOLVING';
    if (status === BUDOKAI_STATUS.Resolved) return 'RESOLVED';
    return 'UNKNOWN';
}

/**
 * Format a pool amount in $ZERO with no decimals, comma-separated.
 */
export function formatPool(pool: bigint | undefined): string {
    if (!pool) return '0';
    const whole = Number(formatEther(pool));
    return whole.toLocaleString(undefined, {maximumFractionDigits: 0});
}

/**
 * Probes Budokai IDs 1..MAX_PROBE via multicall and returns the list of ones that have been
 * configured (status != Unconfigured), along with their entry count.
 *
 * WHY: The Hall of Fame tab needs to render "whatever Budokais exist", not a hardcoded [1,2,3].
 * v6 adds `getLastCreatedBudokaiId()` which would be cheaper, but we also want backward compat
 * with v4 where that selector doesn't exist. Probing is universal.
 */
const HALL_MAX_PROBE = 30;

export interface BudokaiSummary {
    id: number;
    status: number;
    entryCount: number;
    pool: bigint;
}

export function useConfiguredBudokais(): {summaries: BudokaiSummary[]; isLoading: boolean; refetch: () => void} {
    const contracts = useMemo(() => {
        const list = [];
        for (let i = 1; i <= HALL_MAX_PROBE; ++i) {
            list.push({
                address: CONTRACT_ADDRESSES.ZERO_DIAMOND as `0x${string}`,
                abi: SAMURAI_DOJO_ABI,
                functionName: 'getBudokaiInfo' as const,
                args: [BigInt(i)],
                chainId: DOJO_CHAIN_ID,
            });
        }
        return list;
    }, []);

    const {data, isLoading, refetch} = useReadContracts({
        contracts,
        query: {staleTime: 60_000, refetchInterval: 60_000},
    });

    const summaries = useMemo(() => {
        const out: BudokaiSummary[] = [];
        if (!data) return out;
        for (let i = 0; i < HALL_MAX_PROBE; ++i) {
            const r = data[i];
            if (r?.status !== 'success' || !r.result) continue;
            const tuple = r.result as [bigint, bigint, bigint, bigint, bigint, number, number, bigint];
            const status = tuple[6];
            if (status === BUDOKAI_STATUS.Unconfigured) continue;
            out.push({
                id: i + 1,
                status,
                entryCount: Number(tuple[7]),
                pool: tuple[1],
            });
        }
        return out;
    }, [data]);

    return {summaries, isLoading, refetch};
}
