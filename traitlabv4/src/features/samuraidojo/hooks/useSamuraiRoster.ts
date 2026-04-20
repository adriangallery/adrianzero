import {useMemo} from 'react';
import {useReadContract} from 'wagmi';
import {CONTRACT_ADDRESSES} from '@/config/contracts';
import {SAMURAI_BATCH_ABI} from '@/lib/web3/abi';

/**
 * Authoritative list of SAMURAIzero token IDs, queried on-chain via the BatchDeployer.
 *
 * WHY: The ID range 500-1099 contains BOTH SamuraiZERO and regular AdrianZERO NFTs.
 * The minter contract tags tokens at mint time (`getTokensByTag("SamuraiZERO")`), so
 * this is the only source of truth for "is this actually a samurai?".
 *
 * Dynamic: refetches every 2 minutes so new mints appear without a page refresh.
 */
export function useSamuraiRoster(): {roster: Set<number>; isLoading: boolean} {
    const {data, isLoading} = useReadContract({
        address: CONTRACT_ADDRESSES.SAMURAI_BATCH_DEPLOYER as `0x${string}`,
        abi: SAMURAI_BATCH_ABI,
        functionName: 'getTokensByTag',
        args: ['SamuraiZERO'],
        query: {
            staleTime: 60_000, // 1 min — fresh enough for new mints without hammering RPC
            refetchInterval: 120_000, // 2 min refresh cadence
        },
    });

    const roster = useMemo(() => {
        if (!data) return new Set<number>();
        return new Set((data as readonly bigint[]).map((id) => Number(id)));
    }, [data]);

    return {roster, isLoading};
}
