import {useMemo} from 'react';
import {useReadContract} from 'wagmi';
import {base} from 'wagmi/chains';
import {CONTRACT_ADDRESSES} from '@/config/contracts';
import {SAMURAI_DOJO_ABI} from '@/lib/web3/abi';

export interface BudokaiTheme {
    tagline: string;
    themeColor: number; // 0=red, 1=purple, 2=gold, 3=blue, 4=green
    iconVariant: number; // 0=dojo, 1=halloween, 2=anniversary, 3=lantern, ...
    isSpecialEvent: boolean;
}

export function useBudokaiTheme(budokaiId: bigint | null | undefined): {theme: BudokaiTheme | null; refetch: () => void} {
    const {data, refetch} = useReadContract({
        address: CONTRACT_ADDRESSES.ZERO_DIAMOND as `0x${string}`,
        abi: SAMURAI_DOJO_ABI,
        functionName: 'getBudokaiTheme',
        args: budokaiId !== null && budokaiId !== undefined ? [budokaiId] : undefined,
        chainId: base.id,
        query: {
            enabled: budokaiId !== null && budokaiId !== undefined,
            staleTime: 60_000,
        },
    });

    const theme = useMemo<BudokaiTheme | null>(() => {
        if (!data) return null;
        const [tagline, themeColor, iconVariant, isSpecialEvent] = data as readonly [string, number, number, boolean];
        return {
            tagline,
            themeColor: Number(themeColor),
            iconVariant: Number(iconVariant),
            isSpecialEvent,
        };
    }, [data]);

    return {theme, refetch};
}

/**
 * Tailwind class palette per theme color. Conservative — leans on accent text/border tones
 * so it composes with the existing red dojo aesthetic without rewriting the whole module.
 */
export function themeAccent(themeColor: number | undefined): {
    text: string; // text-* class
    border: string; // border-* class
    bg: string; // bg-* (5% opacity) class
    glow: string; // shadow-[...] class
    label: string; // human-readable color name
} {
    switch (themeColor) {
        case 1:
            return {text: 'text-purple-400', border: 'border-purple-500/50', bg: 'bg-purple-500/5', glow: 'shadow-[0_0_24px_rgba(168,85,247,0.25)]', label: 'purple'};
        case 2:
            return {text: 'text-yellow-400', border: 'border-yellow-500/50', bg: 'bg-yellow-500/5', glow: 'shadow-[0_0_24px_rgba(250,204,21,0.30)]', label: 'gold'};
        case 3:
            return {text: 'text-blue-400', border: 'border-blue-500/50', bg: 'bg-blue-500/5', glow: 'shadow-[0_0_24px_rgba(59,130,246,0.25)]', label: 'blue'};
        case 4:
            return {text: 'text-emerald-400', border: 'border-emerald-500/50', bg: 'bg-emerald-500/5', glow: 'shadow-[0_0_24px_rgba(16,185,129,0.25)]', label: 'green'};
        case 0:
        default:
            return {text: 'text-red-400', border: 'border-red-500/50', bg: 'bg-red-500/5', glow: 'shadow-[0_0_24px_rgba(239,68,68,0.25)]', label: 'red'};
    }
}

export function iconVariantSymbol(iconVariant: number | undefined): string {
    switch (iconVariant) {
        case 1: return '🎃'; // halloween
        case 2: return '🎉'; // anniversary
        case 3: return '🏮'; // lantern
        case 0:
        default: return '⛩️'; // dojo
    }
}
