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
 * Used for stats display (samurai vs civilian counts) and per-wallet cap warnings.
 *
 * v8: the 10:1 ratio gate was retired. Civilian eligibility is now per-wallet — see
 * `civilianSlotsForWallet` below.
 */
export function useBudokaiCounters(
    budokaiId: bigint | null | undefined,
    pollMs?: number | false,
): {
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
            refetchInterval: pollMs === undefined ? 30_000 : pollMs,
            refetchOnWindowFocus: true,
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
 * v8 civilian slot computation — purely per-wallet.
 *
 * The contract enforces ONE civilian per wallet per Budokai. We derive the wallet's
 * available slots client-side from the user's own civilian-IN tokens (tokens owned by
 * the user, in the entries set, and outside the Samurai roster). No extra RPC call —
 * the inputs are already loaded by the parent module.
 *
 * Returns 1 (still has a slot) or 0 (already used). The `number` return type is kept
 * so existing call sites (`min(civilReadyIds.length, civilSlotsAvail)`) keep working.
 *
 * Backstop: if the derivation drifts (e.g. user transferred their entered civilian),
 * the contract will revert with `OneCivilianPerWallet()` and the UI surfaces the error.
 */
export function civilianSlotsForWallet(civilianInCount: number): number {
    return civilianInCount > 0 ? 0 : 1;
}
