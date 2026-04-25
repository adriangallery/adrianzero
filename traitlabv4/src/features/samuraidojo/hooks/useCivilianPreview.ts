import {useMemo} from 'react';
import {useReadContracts} from 'wagmi';
import {base} from 'wagmi/chains';
import {CONTRACT_ADDRESSES} from '@/config/contracts';
import {SAMURAI_DOJO_ABI} from '@/lib/web3/abi';

/**
 * Batch-resolve `previewCivilianSenryoku(tokenId)` for civilian (non-samurai) tokens.
 *
 * Civilian senryoku is keccak-derived (1-15) and NOT stored on-chain until the token's
 * first entry. We surface the preview in MINE so users see the SR they'd fight with
 * before paying the entry fee.
 *
 * Returns a Map<tokenId, sr>. Falls back to 0 on call failure (graceful on v4 diamond).
 */
export function useCivilianPreview(tokenIds: number[]): {
    previews: Map<number, number>;
    isLoading: boolean;
} {
    const contracts = useMemo(() => {
        return tokenIds.map((id) => ({
            address: CONTRACT_ADDRESSES.ZERO_DIAMOND as `0x${string}`,
            abi: SAMURAI_DOJO_ABI,
            functionName: 'previewCivilianSenryoku' as const,
            args: [BigInt(id)] as const,
            chainId: base.id,
        }));
    }, [tokenIds]);

    const {data, isLoading} = useReadContracts({
        contracts,
        query: {enabled: tokenIds.length > 0, staleTime: 60_000},
    });

    const previews = useMemo(() => {
        const map = new Map<number, number>();
        if (!data) return map;
        for (let i = 0; i < tokenIds.length; ++i) {
            const raw = data[i]?.result;
            map.set(tokenIds[i], raw !== undefined ? Number(raw) : 0);
        }
        return map;
    }, [data, tokenIds]);

    return {previews, isLoading};
}
