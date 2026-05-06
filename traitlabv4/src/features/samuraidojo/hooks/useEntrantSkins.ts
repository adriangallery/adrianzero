import {useEffect, useState} from 'react';
import {fetchEntrantSkins} from '../lib/budokaiApi';

export interface EntrantSkinOverride {
    imageUrl: string;
    name: string;
}

/**
 * Returns a map of `tokenId (number) → skin` for the given Budokai.
 * Refreshes on a slow cadence — entrant skins only change when a
 * partner-collection holder enters, which is bounded by the entry
 * window. Empty map until a Budokai is active.
 */
export function useEntrantSkins(
    budokaiId: bigint | number | null,
    refreshIntervalMs: number = 30_000,
): Map<number, EntrantSkinOverride> {
    const [skins, setSkins] = useState<Map<number, EntrantSkinOverride>>(new Map());

    useEffect(() => {
        if (budokaiId === null || budokaiId === undefined) {
            setSkins(new Map());
            return;
        }
        let cancelled = false;
        const load = async () => {
            try {
                const res = await fetchEntrantSkins(budokaiId.toString());
                if (cancelled) return;
                const map = new Map<number, EntrantSkinOverride>();
                for (const s of res.skins) {
                    if (!s.imageUrl) continue;
                    const tokenIdNum = Number(s.tokenId);
                    if (!Number.isFinite(tokenIdNum)) continue;
                    map.set(tokenIdNum, {
                        imageUrl: s.imageUrl,
                        name: s.name ?? `civilian #${s.tokenId}`,
                    });
                }
                setSkins(map);
            } catch {
                // Skin overrides are decorative — silently skip on error,
                // entrant cards fall back to the default AdrianLAB render.
            }
        };
        void load();
        const id = setInterval(load, refreshIntervalMs);
        return () => {
            cancelled = true;
            clearInterval(id);
        };
    }, [budokaiId, refreshIntervalMs]);

    return skins;
}
