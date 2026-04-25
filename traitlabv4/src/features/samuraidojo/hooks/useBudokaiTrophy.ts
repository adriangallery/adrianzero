import {useMemo} from 'react';
import {useReadContract} from 'wagmi';
import {base} from 'wagmi/chains';
import {CONTRACT_ADDRESSES} from '@/config/contracts';
import {SAMURAI_DOJO_ABI} from '@/lib/web3/abi';

export const TROPHY_TYPE = {
    None: 0,
    GoldenShuriken: 1,
    MetalShuriken: 2,
    Custom: 3,
} as const;

export type TrophyType = typeof TROPHY_TYPE[keyof typeof TROPHY_TYPE];

export interface BudokaiTrophy {
    trophyType: TrophyType;
    trophyTraitId: bigint;
    trophyWinners: number;
}

export function useBudokaiTrophy(budokaiId: bigint | null | undefined): {trophy: BudokaiTrophy | null; refetch: () => void} {
    const {data, refetch} = useReadContract({
        address: CONTRACT_ADDRESSES.ZERO_DIAMOND as `0x${string}`,
        abi: SAMURAI_DOJO_ABI,
        functionName: 'getBudokaiTrophy',
        args: budokaiId !== null && budokaiId !== undefined ? [budokaiId] : undefined,
        chainId: base.id,
        query: {
            enabled: budokaiId !== null && budokaiId !== undefined,
            staleTime: 60_000,
        },
    });

    const trophy = useMemo<BudokaiTrophy | null>(() => {
        if (!data) return null;
        const [trophyType, trophyTraitId, trophyWinners] = data as readonly [number, bigint, number];
        return {
            trophyType: Number(trophyType) as TrophyType,
            trophyTraitId,
            trophyWinners: Number(trophyWinners),
        };
    }, [data]);

    return {trophy, refetch};
}

export function trophyLabel(trophyType: TrophyType | undefined): string {
    switch (trophyType) {
        case TROPHY_TYPE.GoldenShuriken: return 'Golden Shuriken';
        case TROPHY_TYPE.MetalShuriken: return 'Metal Shuriken';
        case TROPHY_TYPE.Custom: return 'Custom Trophy';
        case TROPHY_TYPE.None: return 'No Trophy';
        default: return '';
    }
}

export function trophyEmoji(trophyType: TrophyType | undefined): string {
    switch (trophyType) {
        case TROPHY_TYPE.GoldenShuriken: return '🏆';
        case TROPHY_TYPE.MetalShuriken: return '🥈';
        case TROPHY_TYPE.Custom: return '🎖️';
        case TROPHY_TYPE.None:
        default: return '';
    }
}
