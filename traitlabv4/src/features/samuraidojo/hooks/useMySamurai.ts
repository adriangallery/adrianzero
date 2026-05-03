import {useEffect, useMemo, useState} from 'react';
import {useAccount} from 'wagmi';
import {CONTRACT_ADDRESSES} from '@/config/contracts';
import {alchemyClient} from '@/lib/api/alchemy/client';
import {useSamuraiRoster} from './useSamuraiRoster';

export interface OwnedZero {
    tokenId: number;
    isSamurai: boolean; // true = pre-loaded senryoku roster member, false = civilian (1-15 SR derived)
}

/**
 * Resolve the connected wallet's AdrianZERO holdings via Alchemy NFT API and tag each as
 * samurai (in the on-chain roster — pre-loaded senryoku) or civilian (regular AdrianZERO).
 *
 * v6 added civilian mode: any AdrianZERO can enter via keccak-derived senryoku 1-15. v8
 * simplified the gate to "1 civilian per wallet, per Budokai" (the old 10:1 ratio gate is
 * retired). Returning all owned tokens with an isSamurai flag lets the UI surface civilians
 * separately and apply the per-wallet rule client-side before submitting the tx.
 *
 * Backwards-compatible API:
 *   - `owned` is the legacy shape: samurai-only id list (existing callers stay correct)
 *   - `civilians` lists the rest of owned AdrianZEROs, sorted
 *   - `all` combines both with isSamurai flag
 */
export function useMySamurai(): {
    owned: number[];
    civilians: number[];
    all: OwnedZero[];
    isLoading: boolean;
    refetch: () => void;
} {
    const {address} = useAccount();
    const {roster, isLoading: rosterLoading} = useSamuraiRoster();
    const [allOwned, setAllOwned] = useState<OwnedZero[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [tick, setTick] = useState(0);

    useEffect(() => {
        if (!address) {
            setAllOwned([]);
            return;
        }
        if (roster.size === 0) {
            // Wait for roster so we can tag samurai vs civilian correctly.
            return;
        }
        let cancelled = false;
        setIsLoading(true);

        (async () => {
            try {
                const response = await alchemyClient.getERC721Tokens(address, [
                    CONTRACT_ADDRESSES.ADRIAN_ZERO,
                ]);
                if (cancelled) return;
                const list: OwnedZero[] = [];
                for (const nft of response.ownedNfts) {
                    const id = Number(nft.tokenId);
                    if (!Number.isFinite(id)) continue;
                    list.push({tokenId: id, isSamurai: roster.has(id)});
                }
                list.sort((a, b) => a.tokenId - b.tokenId);
                setAllOwned(list);
            } catch (err) {
                if (!cancelled) {
                    console.warn('[useMySamurai] Alchemy getERC721Tokens failed:', err);
                    setAllOwned([]);
                }
            } finally {
                if (!cancelled) setIsLoading(false);
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [address, tick, roster]);

    const owned = useMemo(
        () => allOwned.filter((z) => z.isSamurai).map((z) => z.tokenId),
        [allOwned],
    );
    const civilians = useMemo(
        () => allOwned.filter((z) => !z.isSamurai).map((z) => z.tokenId),
        [allOwned],
    );

    return {
        owned,
        civilians,
        all: allOwned,
        isLoading: isLoading || rosterLoading,
        refetch: () => setTick((n) => n + 1),
    };
}
