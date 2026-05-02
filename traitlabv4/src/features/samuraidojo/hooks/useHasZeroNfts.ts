import {useMySamurai} from './useMySamurai';

/**
 * Returns whether the connected wallet owns at least one AdrianZERO (samurai or civilian).
 * Used by the Budokai page to decide whether to show the onboarding flow vs the dojo grid.
 *
 * `hasAny` is `false` when no wallet is connected — the onboarding renders for both
 * !isConnected and isConnected-but-empty so they share a single entry-point layout.
 */
export function useHasZeroNfts(): {hasAny: boolean; isLoading: boolean; refetch: () => void} {
    const {owned, civilians, isLoading, refetch} = useMySamurai();
    return {
        hasAny: owned.length + civilians.length > 0,
        isLoading,
        refetch,
    };
}
