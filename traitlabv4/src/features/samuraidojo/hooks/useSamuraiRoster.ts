import {useMemo} from 'react';
import {useReadContracts} from 'wagmi';
import {CONTRACT_ADDRESSES} from '@/config/contracts';
import {SAMURAI_BATCH_ABI, SAMURAI_MINT_FACET_ABI} from '@/lib/web3/abi';

/**
 * Authoritative list of SAMURAIzero token IDs, queried on-chain.
 *
 * WHY: The ID range 500-1099 contains BOTH SamuraiZERO and regular AdrianZERO NFTs.
 * Samurai tokens are tagged at mint time and the tag registry lives in TWO contracts:
 *
 *   1. Legacy BatchDeployer (0xA988F323...) — holds the first 196/600 Samurais
 *      minted pre-$ZERO migration (when the mint was paid in $ADRIAN).
 *   2. $ZERO Diamond SamuraiMintFacet (0x542b2B96...) — holds all new Samurais
 *      minted post-migration (paid in $ZERO).
 *
 * The roster is the union of both lists. Both contracts expose the exact same
 * `getTokensByTag(string)` interface — deliberate pattern so AdrianLAB + downstream
 * consumers can merge sources without code duplication.
 *
 * See `docs/MINT_FACET_PATTERN.md` in zero-diamond for the full pattern spec.
 *
 * Dynamic: refetches every 2 minutes so new mints appear without a page refresh.
 */
export function useSamuraiRoster(): {roster: Set<number>; isLoading: boolean} {
    const {data, isLoading} = useReadContracts({
        contracts: [
            {
                address: CONTRACT_ADDRESSES.SAMURAI_BATCH_DEPLOYER as `0x${string}`,
                abi: SAMURAI_BATCH_ABI,
                functionName: 'getTokensByTag',
                args: ['SamuraiZERO'],
            },
            {
                address: CONTRACT_ADDRESSES.ZERO_DIAMOND as `0x${string}`,
                abi: SAMURAI_MINT_FACET_ABI,
                functionName: 'getTokensByTag',
                args: ['SamuraiZERO'],
            },
        ],
        query: {
            staleTime: 60_000, // 1 min — fresh enough for new mints without hammering RPC
            refetchInterval: 120_000, // 2 min refresh cadence
        },
    });

    const roster = useMemo(() => {
        const merged = new Set<number>();
        for (const r of data ?? []) {
            if (r.status !== 'success' || !r.result) continue;
            for (const id of r.result as readonly bigint[]) {
                merged.add(Number(id));
            }
        }
        return merged;
    }, [data]);

    return {roster, isLoading};
}
