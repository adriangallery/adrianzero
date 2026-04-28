import {useEffect, useMemo, useState} from 'react';
import {useReadContract, useAccount} from 'wagmi';
import {base} from 'wagmi/chains';
import {CONTRACT_ADDRESSES} from '@/config/contracts';
import {MOVIE_AUCTION_FACET_ABI, AUCTION_STATUS} from '@/lib/web3/abi';
import {MOVIES_S2_MOCK} from '@/features/zeromovies/data/movies2Mock';

export interface AuctionState {
    auctionId: bigint;
    movieId: number;
    movieName: string;
    posterUrl: string;
    hasAnimation: boolean;
    startTime: number;       // unix seconds
    endTime: number;         // unix seconds (mutable via anti-snipe)
    startPrice: bigint;
    minIncrementBps: bigint;
    topBidder: string;
    topBid: bigint;
    minNextBid: bigint;
    statusCode: number;
    isLive: boolean;
    secondsLeft: number;
    youAreTopBidder: boolean;
}

const ZERO_ADDR = '0x0000000000000000000000000000000000000000';
const ADRIAN_LAB_BASE = 'https://adrianlab.vercel.app/labimages/zeromovies2';

function resolveMovieMeta(movieId: number) {
    const entry = MOVIES_S2_MOCK.find((m) => m.id === movieId);
    if (!entry) {
        return {
            name: `Movie #${movieId}`,
            posterUrl: `${ADRIAN_LAB_BASE}/${movieId}.svg`,
            hasAnimation: false,
        };
    }
    return {
        name: entry.name,
        posterUrl: entry.hasAnimation ? `${ADRIAN_LAB_BASE}/animated/${entry.id}.gif` : `${ADRIAN_LAB_BASE}/${entry.id}.svg`,
        hasAnimation: !!entry.hasAnimation,
    };
}

/**
 * Read the latest auction (auctionId = getCurrentAuctionId) + the per-second
 * countdown. Polls `getAuction` every 12s so the UI picks up new bids even if
 * the user doesn't refresh the page.
 */
export function useAuction(): {
    auction: AuctionState | null;
    refetch: () => void;
    isLoading: boolean;
} {
    const {address} = useAccount();

    const {data: currentIdRaw, refetch: refetchCurrent} = useReadContract({
        address: CONTRACT_ADDRESSES.ZERO_DIAMOND as `0x${string}`,
        abi: MOVIE_AUCTION_FACET_ABI,
        functionName: 'getCurrentAuctionId',
        chainId: base.id,
        query: {refetchInterval: 12_000, staleTime: 6_000},
    });

    const currentId = currentIdRaw ? BigInt(currentIdRaw as bigint) : 0n;
    const enabled = currentId > 0n;

    const {data: auctionData, refetch: refetchAuction, isLoading} = useReadContract({
        address: CONTRACT_ADDRESSES.ZERO_DIAMOND as `0x${string}`,
        abi: MOVIE_AUCTION_FACET_ABI,
        functionName: 'getAuction',
        args: enabled ? [currentId] : undefined,
        chainId: base.id,
        query: {enabled, refetchInterval: 12_000, staleTime: 6_000},
    });

    const {data: minNextRaw, refetch: refetchMinNext} = useReadContract({
        address: CONTRACT_ADDRESSES.ZERO_DIAMOND as `0x${string}`,
        abi: MOVIE_AUCTION_FACET_ABI,
        functionName: 'getMinNextBid',
        args: enabled ? [currentId] : undefined,
        chainId: base.id,
        query: {enabled, refetchInterval: 12_000, staleTime: 6_000},
    });

    // Per-second countdown — never re-fetches the contract.
    const [now, setNow] = useState(() => Math.floor(Date.now() / 1000));
    useEffect(() => {
        const t = setInterval(() => setNow(Math.floor(Date.now() / 1000)), 1000);
        return () => clearInterval(t);
    }, []);

    const auction = useMemo<AuctionState | null>(() => {
        if (!enabled || !auctionData) return null;
        const arr = auctionData as readonly [
            bigint, // movieId
            bigint, // startTime
            bigint, // endTime
            bigint, // antiSnipeWindow
            bigint, // antiSnipeExtension
            bigint, // startPrice
            bigint, // minIncrementBps
            string, // topBidder
            bigint, // topBid
            number, // status
        ];
        const movieId = Number(arr[0]);
        const startTime = Number(arr[1]);
        const endTime = Number(arr[2]);
        const startPrice = arr[5];
        const minIncrementBps = arr[6];
        const topBidder = (arr[7] as string).toLowerCase();
        const topBid = arr[8];
        const statusCode = Number(arr[9]);
        const meta = resolveMovieMeta(movieId);
        const minNextBid = (minNextRaw as bigint | undefined) ?? startPrice;
        const secondsLeft = Math.max(0, endTime - now);
        const isLive = statusCode === AUCTION_STATUS.Active && secondsLeft > 0;

        return {
            auctionId: currentId,
            movieId,
            movieName: meta.name,
            posterUrl: meta.posterUrl,
            hasAnimation: meta.hasAnimation,
            startTime,
            endTime,
            startPrice,
            minIncrementBps,
            topBidder,
            topBid,
            minNextBid,
            statusCode,
            isLive,
            secondsLeft,
            youAreTopBidder: !!address && topBidder !== ZERO_ADDR && topBidder === address.toLowerCase(),
        };
    }, [enabled, auctionData, minNextRaw, currentId, address, now]);

    return {
        auction,
        isLoading,
        refetch: () => {
            refetchCurrent();
            refetchAuction();
            refetchMinNext();
        },
    };
}

/**
 * Outbid balance for the connected wallet. Pull-pattern — anyone with a
 * positive balance can call `withdrawOutbid` to recover their ZERO.
 */
export function useOutbidBalance(): {
    balance: bigint;
    refetch: () => void;
} {
    const {address} = useAccount();

    const {data, refetch} = useReadContract({
        address: CONTRACT_ADDRESSES.ZERO_DIAMOND as `0x${string}`,
        abi: MOVIE_AUCTION_FACET_ABI,
        functionName: 'getOutbidBalance',
        args: address ? [address] : undefined,
        chainId: base.id,
        query: {enabled: !!address, refetchInterval: 30_000, staleTime: 12_000},
    });

    return {balance: (data as bigint | undefined) ?? 0n, refetch};
}
