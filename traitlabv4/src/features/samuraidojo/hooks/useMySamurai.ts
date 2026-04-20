import {useMemo} from 'react';
import {useAccount, useReadContracts} from 'wagmi';
import {CONTRACT_ADDRESSES} from '@/config/contracts';
import {ADRIAN_ZERO_ABI} from '@/lib/web3/abi';
import {FIRST_SAMURAI_TOKEN_ID, LAST_SAMURAI_TOKEN_ID} from '../types';

/**
 * Scan tokens 500-1099 via multicall to find the ones owned by the connected wallet.
 * Batches in groups of 100 to stay within RPC limits.
 */
export function useMySamurai(): {owned: number[]; isLoading: boolean; refetch: () => void} {
    const {address} = useAccount();

    const contracts = useMemo(() => {
        if (!address) return [];
        const list: Array<{address: `0x${string}`; abi: typeof ADRIAN_ZERO_ABI; functionName: 'ownerOf'; args: [bigint]}> = [];
        for (let id = FIRST_SAMURAI_TOKEN_ID; id <= LAST_SAMURAI_TOKEN_ID; ++id) {
            list.push({
                address: CONTRACT_ADDRESSES.ADRIAN_ZERO as `0x${string}`,
                abi: ADRIAN_ZERO_ABI,
                functionName: 'ownerOf',
                args: [BigInt(id)],
            });
        }
        return list;
    }, [address]);

    const {data, isLoading, refetch} = useReadContracts({
        contracts,
        allowFailure: true,
        query: {enabled: !!address, staleTime: 60_000},
    });

    const owned = useMemo(() => {
        if (!data || !address) return [];
        const lowercase = address.toLowerCase();
        const result: number[] = [];
        for (let i = 0; i < data.length; ++i) {
            const tokenId = FIRST_SAMURAI_TOKEN_ID + i;
            const owner = data[i]?.result as string | undefined;
            if (owner && owner.toLowerCase() === lowercase) {
                result.push(tokenId);
            }
        }
        return result;
    }, [data, address]);

    return {owned, isLoading, refetch: () => void refetch()};
}
