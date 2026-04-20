import {useEffect, useState} from 'react';
import {useAccount} from 'wagmi';
import {CONTRACT_ADDRESSES} from '@/config/contracts';
import {alchemyClient} from '@/lib/api/alchemy/client';
import {FIRST_SAMURAI_TOKEN_ID, LAST_SAMURAI_TOKEN_ID} from '../types';

/**
 * Resolve the connected wallet's SAMURAIzero token IDs via Alchemy NFT API
 * (single paginated request per collection) and filter to the samurai range [500, 1099].
 *
 * This replaces a naïve 600-ownerOf multicall that hammered the public Base RPC
 * and produced 429 rate-limit errors.
 */
export function useMySamurai(): {owned: number[]; isLoading: boolean; refetch: () => void} {
    const {address} = useAccount();
    const [owned, setOwned] = useState<number[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [tick, setTick] = useState(0);

    useEffect(() => {
        if (!address) {
            setOwned([]);
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
                    if (
                        Number.isFinite(id)
                        && id >= FIRST_SAMURAI_TOKEN_ID
                        && id <= LAST_SAMURAI_TOKEN_ID
                    ) {
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
    }, [address, tick]);

    return {owned, isLoading, refetch: () => setTick((n) => n + 1)};
}
