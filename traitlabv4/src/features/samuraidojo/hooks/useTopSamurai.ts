import {useMemo} from 'react';
import {useReadContracts} from 'wagmi';
import {base} from 'wagmi/chains';
import {CONTRACT_ADDRESSES} from '@/config/contracts';
import {SAMURAI_DOJO_ABI} from '@/lib/web3/abi';
import {useSamuraiRoster} from './useSamuraiRoster';

export interface TopSamurai {
    tokenId: number;
    senryoku: number;
    honor: number;
    effectiveSR: number; // senryoku + honor
}

/**
 * Top samurai leaderboard ranked by effective SR (senryoku + honor).
 *
 * Strategy:
 *   - Roster comes from `useSamuraiRoster` (already cached, refetches every 2 min).
 *   - We multicall `getEffectiveSR(tokenId)` for the entire roster — one RPC round trip
 *     via wagmi's automatic multicall batching. ~300 reads collapse into 1 multicall call.
 *   - Result is sorted descending and sliced to `limit`. Cached for 5 min, refetched every
 *     5 min: SR moves only on entry events (small + rare), honor moves only on Budokai
 *     resolve (very rare). 5-min staleness is fine.
 *   - Honor is read separately so we can show the breakdown (SR vs honor) in the UI.
 *
 * Resource cost:
 *   - 2 multicalls per refresh (effectiveSR + honor for ~300 tokens) → ~600 internal calls
 *     batched into 2 RPC requests every 5 min. Negligible.
 */
export function useTopSamurai(limit: number = 10): {
    leaderboard: TopSamurai[];
    isLoading: boolean;
} {
    const {roster, isLoading: rosterLoading} = useSamuraiRoster();
    const tokenIds = useMemo(() => Array.from(roster).sort((a, b) => a - b), [roster]);

    const effectiveSrCalls = useMemo(
        () =>
            tokenIds.map((id) => ({
                address: CONTRACT_ADDRESSES.ZERO_DIAMOND as `0x${string}`,
                abi: SAMURAI_DOJO_ABI,
                functionName: 'getEffectiveSR' as const,
                args: [BigInt(id)] as const,
                chainId: base.id,
            })),
        [tokenIds],
    );

    const honorCalls = useMemo(
        () =>
            tokenIds.map((id) => ({
                address: CONTRACT_ADDRESSES.ZERO_DIAMOND as `0x${string}`,
                abi: SAMURAI_DOJO_ABI,
                functionName: 'getHonor' as const,
                args: [BigInt(id)] as const,
                chainId: base.id,
            })),
        [tokenIds],
    );

    const {data: effSrData, isLoading: effSrLoading} = useReadContracts({
        contracts: effectiveSrCalls,
        query: {
            enabled: tokenIds.length > 0,
            staleTime: 300_000, // 5 min — SR only moves on entry, honor only on Budokai resolve
            refetchInterval: 300_000,
        },
    });

    const {data: honorData, isLoading: honorLoading} = useReadContracts({
        contracts: honorCalls,
        query: {
            enabled: tokenIds.length > 0,
            staleTime: 300_000,
            refetchInterval: 300_000,
        },
    });

    const leaderboard = useMemo<TopSamurai[]>(() => {
        if (!effSrData || !honorData || tokenIds.length === 0) return [];
        const rows: TopSamurai[] = [];
        for (let i = 0; i < tokenIds.length; ++i) {
            const effSrRes = effSrData[i];
            const honorRes = honorData[i];
            if (effSrRes?.status !== 'success' || honorRes?.status !== 'success') continue;
            const effectiveSR = Number(effSrRes.result as unknown as bigint | number);
            const honor = Number(honorRes.result as unknown as bigint | number);
            const senryoku = effectiveSR - honor;
            // Skip tokens with no on-chain SR (registered but not yet loaded).
            if (effectiveSR <= 0) continue;
            rows.push({tokenId: tokenIds[i], senryoku, honor, effectiveSR});
        }
        // Highest first; tiebreak on raw senryoku, then on tokenId for stable order.
        rows.sort((a, b) => {
            if (b.effectiveSR !== a.effectiveSR) return b.effectiveSR - a.effectiveSR;
            if (b.senryoku !== a.senryoku) return b.senryoku - a.senryoku;
            return a.tokenId - b.tokenId;
        });
        return rows.slice(0, limit);
    }, [effSrData, honorData, tokenIds, limit]);

    return {
        leaderboard,
        isLoading: rosterLoading || effSrLoading || honorLoading,
    };
}
