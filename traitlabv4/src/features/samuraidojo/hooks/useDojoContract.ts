import {useReadContract} from 'wagmi';
import {formatEther} from 'viem';
import {CONTRACT_ADDRESSES} from '@/config/contracts';
import {SAMURAI_DOJO_ABI, BUDOKAI_STATUS} from '@/lib/web3/abi';
import type {BudokaiInfo, Champions} from '../types';

/**
 * Reads the currently-open Budokai ID (0 if none configured).
 */
export function useCurrentBudokaiId() {
    const {data, refetch, isLoading} = useReadContract({
        address: CONTRACT_ADDRESSES.ZERO_DIAMOND as `0x${string}`,
        abi: SAMURAI_DOJO_ABI,
        functionName: 'getCurrentBudokaiId',
        query: {refetchInterval: 30_000},
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
        query: {enabled: budokaiId !== undefined, refetchInterval: 15_000},
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
 */
export function useBudokaiEntries(budokaiId: number | undefined) {
    const {data, refetch, isLoading} = useReadContract({
        address: CONTRACT_ADDRESSES.ZERO_DIAMOND as `0x${string}`,
        abi: SAMURAI_DOJO_ABI,
        functionName: 'getEntries',
        args: budokaiId !== undefined ? [BigInt(budokaiId)] : undefined,
        query: {enabled: budokaiId !== undefined, refetchInterval: 15_000},
    });

    const entries = ((data as bigint[] | undefined) ?? []).map((id) => Number(id));
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
