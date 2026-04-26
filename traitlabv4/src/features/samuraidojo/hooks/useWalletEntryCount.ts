import {useMemo} from 'react';
import {useAccount, useReadContract, useReadContracts} from 'wagmi';
import {base} from 'wagmi/chains';
import {CONTRACT_ADDRESSES} from '@/config/contracts';
import {SAMURAI_DOJO_ABI} from '@/lib/web3/abi';
import type {BudokaiCounters} from './useBudokaiCounters';

export interface WalletEntryGate {
    entries: number;
    cap: number;
    remaining: number;
    reached: boolean;
    loaded: boolean;
}

/**
 * v6 per-wallet entry cap. The contract reverts `WalletCapReached` when
 * `entriesByWallet[budokai][msg.sender] >= maxPerWallet` (per-Budokai override
 * if non-zero, else the global `defaultMaxPerWallet`). UI must mirror this so
 * the user never burns gas on a guaranteed-revert tx.
 */
export function useWalletEntryCount(
    budokaiId: bigint | null | undefined,
    counters: BudokaiCounters | null,
): {gate: WalletEntryGate; refetch: () => void} {
    const {address} = useAccount();
    const enabled = budokaiId !== null && budokaiId !== undefined && !!address;

    const {data, refetch} = useReadContracts({
        allowFailure: true,
        contracts: enabled
            ? [
                  {
                      address: CONTRACT_ADDRESSES.ZERO_DIAMOND as `0x${string}`,
                      abi: SAMURAI_DOJO_ABI,
                      functionName: 'getEntriesByWallet',
                      args: [budokaiId as bigint, address as `0x${string}`],
                      chainId: base.id,
                  },
                  {
                      address: CONTRACT_ADDRESSES.ZERO_DIAMOND as `0x${string}`,
                      abi: SAMURAI_DOJO_ABI,
                      functionName: 'getDefaultMaxPerWallet',
                      chainId: base.id,
                  },
              ]
            : [],
        query: {enabled, refetchInterval: 30_000},
    });

    const gate = useMemo<WalletEntryGate>(() => {
        const entriesRes = data?.[0];
        const defaultRes = data?.[1];
        const entries = entriesRes?.status === 'success' ? Number(entriesRes.result as bigint | number) : 0;
        const defaultCap = defaultRes?.status === 'success' ? Number(defaultRes.result as bigint | number) : 0;
        const perBudokai = counters?.maxPerWallet ?? 0;
        const cap = perBudokai > 0 ? perBudokai : defaultCap;
        const loaded = !!data && data.length > 0;
        const remaining = cap > 0 ? Math.max(0, cap - entries) : Number.POSITIVE_INFINITY;
        const reached = cap > 0 && entries >= cap;
        return {entries, cap, remaining, reached, loaded};
    }, [data, counters]);

    return {gate, refetch};
}
