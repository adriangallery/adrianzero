import {useMemo} from 'react';
import {useReadContracts} from 'wagmi';
import {CONTRACT_ADDRESSES} from '@/config/contracts';
import {SAMURAI_DOJO_ABI} from '@/lib/web3/abi';

export interface PerTokenState {
    tokenId: number;
    senryoku: number;
    isKnockedOut: boolean;
}

/**
 * Batch-read Senryoku + KO status for a list of tokenIds via a single multicall.
 * Returns a map keyed by tokenId.
 */
export function useSamuraiState(tokenIds: number[]): {
    states: Map<number, PerTokenState>;
    refetch: () => void;
    isLoading: boolean;
} {
    const contracts = useMemo(() => {
        const list: Array<{address: `0x${string}`; abi: typeof SAMURAI_DOJO_ABI; functionName: 'getSenryoku' | 'isKnockedOut'; args: [bigint]}> = [];
        for (const id of tokenIds) {
            list.push({
                address: CONTRACT_ADDRESSES.ZERO_DIAMOND as `0x${string}`,
                abi: SAMURAI_DOJO_ABI,
                functionName: 'getSenryoku',
                args: [BigInt(id)],
            });
            list.push({
                address: CONTRACT_ADDRESSES.ZERO_DIAMOND as `0x${string}`,
                abi: SAMURAI_DOJO_ABI,
                functionName: 'isKnockedOut',
                args: [BigInt(id)],
            });
        }
        return list;
    }, [tokenIds]);

    const {data, refetch, isLoading} = useReadContracts({
        contracts,
        query: {enabled: tokenIds.length > 0, refetchInterval: 30_000},
    });

    const states = useMemo(() => {
        const map = new Map<number, PerTokenState>();
        if (!data) return map;
        for (let i = 0; i < tokenIds.length; ++i) {
            const senryokuRaw = data[i * 2]?.result;
            const koRaw = data[i * 2 + 1]?.result;
            map.set(tokenIds[i], {
                tokenId: tokenIds[i],
                senryoku: senryokuRaw !== undefined ? Number(senryokuRaw) : 0,
                isKnockedOut: !!koRaw,
            });
        }
        return map;
    }, [data, tokenIds]);

    return {states, refetch, isLoading};
}
