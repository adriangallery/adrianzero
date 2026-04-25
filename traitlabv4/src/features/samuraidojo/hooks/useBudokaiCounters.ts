import {useMemo} from 'react';
import {useReadContract} from 'wagmi';
import {base} from 'wagmi/chains';
import {CONTRACT_ADDRESSES} from '@/config/contracts';
import {SAMURAI_DOJO_ABI} from '@/lib/web3/abi';

export interface BudokaiCounters {
    samuraiCount: number;
    civilianCount: number;
    maxPerWallet: number;
    entryFee: bigint;
    freeEntry: boolean;
}

/**
 * Read v6 Budokai counters: samurai/civilian split, per-Budokai cap, fee, free flag.
 * Used to drive the ratio gate UI (10:1 samurai:civilian) and per-wallet cap warnings.
 *
 * On v4 diamonds (or for legacy Budokais ≤1) the call returns zeros, which the UI
 * should treat as "civilians not yet enabled / falls back to legacy path".
 */
export function useBudokaiCounters(budokaiId: bigint | null | undefined): {
    counters: BudokaiCounters | null;
    refetch: () => void;
} {
    const {data, refetch} = useReadContract({
        address: CONTRACT_ADDRESSES.ZERO_DIAMOND as `0x${string}`,
        abi: SAMURAI_DOJO_ABI,
        functionName: 'getBudokaiCounters',
        args: budokaiId !== null && budokaiId !== undefined ? [budokaiId] : undefined,
        chainId: base.id,
        query: {
            enabled: budokaiId !== null && budokaiId !== undefined,
            refetchInterval: 30_000,
        },
    });

    const counters = useMemo<BudokaiCounters | null>(() => {
        if (!data) return null;
        const [samuraiCount, civilianCount, maxPerWallet, entryFee, freeEntry] = data as readonly [
            number,
            number,
            number,
            bigint,
            boolean,
        ];
        return {
            samuraiCount: Number(samuraiCount),
            civilianCount: Number(civilianCount),
            maxPerWallet: Number(maxPerWallet),
            entryFee,
            freeEntry,
        };
    }, [data]);

    return {counters, refetch};
}

/**
 * Compute civilian slots available given current counters and the 10:1 ratio gate.
 * Formula (matches contract): `samuraiCount >= (civilianCount + 1) * 10`
 *   → max civilians allowed = floor(samuraiCount / 10)
 *   → available now = max(0, max - civilianCount)
 */
export function civilianSlotsAvailable(counters: BudokaiCounters | null): number {
    if (!counters) return 0;
    const maxCivilians = Math.floor(counters.samuraiCount / 10);
    return Math.max(0, maxCivilians - counters.civilianCount);
}
