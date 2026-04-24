import {useMemo} from 'react';
import {useReadContracts} from 'wagmi';
import {base} from 'wagmi/chains';
import {CONTRACT_ADDRESSES} from '@/config/contracts';
import {SAMURAI_DOJO_ABI} from '@/lib/web3/abi';

export interface PerTokenState {
    tokenId: number;
    senryoku: number;
    isKnockedOut: boolean;
    honor: number; // v6: persistent bracket-combat bonus. 0 on v4.
}

/**
 * Batch-read Senryoku + KO status + honor for a list of tokenIds via a single multicall.
 * Returns a map keyed by tokenId.
 *
 * v6 note: `getHonor` is a v6 selector. On v4-deployed diamonds the call fails gracefully
 * (wagmi returns status='failure' per contract) and we default honor to 0 for those tokens.
 */
export function useSamuraiState(tokenIds: number[]): {
    states: Map<number, PerTokenState>;
    refetch: () => void;
    isLoading: boolean;
} {
    const contracts = useMemo(() => {
        type Call = {
            address: `0x${string}`;
            abi: typeof SAMURAI_DOJO_ABI;
            functionName: 'getSenryoku' | 'isKnockedOut' | 'getHonor';
            args: [bigint];
            chainId: number;
        };
        const list: Call[] = [];
        for (const id of tokenIds) {
            list.push({
                address: CONTRACT_ADDRESSES.ZERO_DIAMOND as `0x${string}`,
                abi: SAMURAI_DOJO_ABI,
                functionName: 'getSenryoku',
                args: [BigInt(id)],
                chainId: base.id,
            });
            list.push({
                address: CONTRACT_ADDRESSES.ZERO_DIAMOND as `0x${string}`,
                abi: SAMURAI_DOJO_ABI,
                functionName: 'isKnockedOut',
                args: [BigInt(id)],
                chainId: base.id,
            });
            list.push({
                address: CONTRACT_ADDRESSES.ZERO_DIAMOND as `0x${string}`,
                abi: SAMURAI_DOJO_ABI,
                functionName: 'getHonor',
                args: [BigInt(id)],
                chainId: base.id,
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
            const senryokuRaw = data[i * 3]?.result;
            const koRaw = data[i * 3 + 1]?.result;
            const honorRaw = data[i * 3 + 2]?.result;
            map.set(tokenIds[i], {
                tokenId: tokenIds[i],
                senryoku: senryokuRaw !== undefined ? Number(senryokuRaw) : 0,
                isKnockedOut: !!koRaw,
                honor: honorRaw !== undefined ? Number(honorRaw) : 0,
            });
        }
        return map;
    }, [data, tokenIds]);

    return {states, refetch, isLoading};
}
