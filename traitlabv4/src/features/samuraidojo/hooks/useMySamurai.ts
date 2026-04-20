import {useEffect, useState} from 'react';
import {useAccount} from 'wagmi';
import {CONTRACT_ADDRESSES} from '@/config/contracts';
import {alchemyClient} from '@/lib/api/alchemy/client';
import {useSamuraiRoster} from './useSamuraiRoster';

/**
 * Resolve the connected wallet's SAMURAIzero token IDs via Alchemy NFT API
 * (single paginated request per collection) and filter to the samurai range [500, 1099].
 *
 * This replaces a naïve 600-ownerOf multicall that hammered the public Base RPC
 * and produced 429 rate-limit errors.
 */
export function useMySamurai(): {owned: number[]; isLoading: boolean; refetch: () => void} {
    const {address} = useAccount();
    const {roster, isLoading: rosterLoading} = useSamuraiRoster();
    const [owned, setOwned] = useState<number[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [tick, setTick] = useState(0);

    useEffect(() => {
        if (!address) {
            setOwned([]);
            return;
        }
        if (roster.size === 0) {
            // Wait for roster so we can filter correctly
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
                const tokenIds: number[] = [];
                for (const nft of response.ownedNfts) {
                    const id = Number(nft.tokenId);
                    // Filter to the authoritative on-chain samurai roster.
                    // The 500-1099 id range contains a mix of SamuraiZERO and regular
                    // AdrianZERO tokens; the minter's tag is the only source of truth.
                    if (Number.isFinite(id) && roster.has(id)) {
                        tokenIds.push(id);
                    }
                }
                tokenIds.sort((a, b) => a - b);
                setOwned(tokenIds);
            } catch (err) {
                if (!cancelled) {
                    console.warn('[useMySamurai] Alchemy getERC721Tokens failed:', err);
                    setOwned([]);
                }
            } finally {
                if (!cancelled) setIsLoading(false);
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [address, tick, roster]);

    return {owned, isLoading: isLoading || rosterLoading, refetch: () => setTick((n) => n + 1)};
}
