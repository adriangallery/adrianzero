import {useEffect} from 'react';
import {useAccount} from 'wagmi';
import {formatUnits} from 'viem';
import {Loader2, Film, Trophy} from 'lucide-react';
import {useAuction, useOutbidBalance} from '../hooks/useAuction';
import {useWithdrawOutbid} from '../hooks/useAuctionActions';
import {CountdownTimer} from './CountdownTimer';
import {BidPanel} from './BidPanel';
import {MOVIES_S2_MOCK} from '@/features/zeromovies/data/movies2Mock';

/**
 * Pre-launch placeholder. Until the owner calls `createAuction(42, ...)`, the
 * page shows the queued auction movie (Major Dutch Schaefer GIF) with a
 * "coming soon" badge — that way visitors know what's about to drop and the
 * page isn't a blank "no auction" message.
 */
const RESERVED_AUCTION_MOVIE = MOVIES_S2_MOCK.find((m) => m.reservedFor === 'auction');
const ADRIAN_LAB_BASE = 'https://adrianlab.vercel.app/labimages/zeromovies2';

const ZERO_ADDR = '0x0000000000000000000000000000000000000000';

/**
 * /auction page — single live auction view (the latest auctionId returned by
 * `getCurrentAuctionId`). Shows the GIF/SVG cover, countdown, top bid, bid
 * controls, outbid refund CTA, and a quick blurb about the split (50/20/30).
 */
export function AuctionModule() {
    const {auction, isLoading, refetch} = useAuction();
    const {balance: outbidBalance, refetch: refetchOutbid} = useOutbidBalance();
    const {address, isConnected} = useAccount();
    const {withdraw, isPending: isWithdrawPending, isConfirming: isWithdrawConfirming, isConfirmed: isWithdrawConfirmed} = useWithdrawOutbid();

    useEffect(() => {
        if (isWithdrawConfirmed) refetchOutbid();
    }, [isWithdrawConfirmed, refetchOutbid]);

    if (isLoading) {
        return (
            <div className="flex min-h-[40vh] items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-zinc-500" />
            </div>
        );
    }

    if (!auction) {
        const reserved = RESERVED_AUCTION_MOVIE;
        const previewUrl = reserved?.hasAnimation
            ? `${ADRIAN_LAB_BASE}/animated/${reserved.id}.gif`
            : reserved
              ? `${ADRIAN_LAB_BASE}/${reserved.id}.svg`
              : null;
        return (
            <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-10">
                <div className="text-center">
                    <span className="text-[8px] font-bold uppercase tracking-[0.3em] text-purple-400">
                        ZEROmovies S2 · Pre-launch Auction
                    </span>
                    <h1 className="mt-1 text-2xl font-bold tracking-wider text-yellow-400 sm:text-3xl">
                        {reserved?.name ?? 'Coming soon'}
                    </h1>
                    <p className="mt-2 text-[11px] uppercase tracking-widest text-zinc-500">
                        Auction date · TBD
                    </p>
                </div>

                <div className="mt-6 flex flex-col items-center gap-4 sm:flex-row sm:items-start sm:gap-6">
                    {previewUrl ? (
                        <div className="relative w-full max-w-xs shrink-0">
                            <div className="relative overflow-hidden rounded border-2 border-purple-500/40 bg-zinc-950 shadow-[0_0_48px_rgba(168,85,247,0.20)]">
                                <img
                                    src={previewUrl}
                                    alt={reserved?.name ?? 'Movie preview'}
                                    className="aspect-square w-full object-contain"
                                    style={{imageRendering: 'pixelated'}}
                                    loading="eager"
                                />
                                {reserved?.hasAnimation && (
                                    <div className="absolute top-2 right-2 rounded bg-purple-500 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-black">
                                        Animated · GIF
                                    </div>
                                )}
                                <div className="absolute inset-x-0 bottom-0 flex justify-center bg-gradient-to-t from-black/80 to-transparent px-2 pt-6 pb-2">
                                    <span className="rounded bg-purple-500 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-black">
                                        Reserved · Auction
                                    </span>
                                </div>
                            </div>
                            <p className="mt-2 text-center text-[10px] text-zinc-500">
                                Movie ID #{reserved?.id} · 1/1 ZEROmovies S2 cover
                            </p>
                        </div>
                    ) : (
                        <Film className="h-12 w-12 text-zinc-700" />
                    )}

                    <div className="flex-1 space-y-3">
                        <div className="rounded border border-zinc-800 bg-zinc-950/60 p-3">
                            <span className="text-[8px] font-bold uppercase tracking-[0.3em] text-zinc-500">What's coming</span>
                            <p className="mt-1 text-[11px] leading-relaxed text-zinc-300">
                                A 48-hour English auction in <span className="font-bold text-yellow-400">$ZERO</span> for
                                the only animated cover in S2. Bids start at{' '}
                                <span className="font-bold text-white">5,000 ZERO</span>, +5% min increment, with anti-snipe
                                extensions on bids placed in the last 5 minutes.
                            </p>
                        </div>

                        <div className="grid grid-cols-3 gap-2">
                            <Stat label="Start price" value="5,000 ZERO" sub="no reserve" />
                            <Stat label="Duration" value="48h" sub="anti-snipe +5min" />
                            <Stat label="Split" value="50/30/20" sub="burn / FF / S1 pool" />
                        </div>

                        <div className="rounded border border-purple-500/30 bg-purple-950/20 p-3 text-[10px] leading-relaxed text-purple-200">
                            Watch the Discord and X feed for the start time announcement. The
                            countdown lights up here the moment the auction goes live.
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    const {topBidder, topBid} = auction;
    const hasBid = topBidder !== ZERO_ADDR && topBid > 0n;

    return (
        <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6">
            {/* Header */}
            <div className="mb-4 text-center sm:mb-6">
                <span className="text-[8px] font-bold uppercase tracking-[0.3em] text-purple-400">
                    ZEROmovies S2 · Pre-launch Auction
                </span>
                <h1 className="mt-1 text-2xl font-bold tracking-wider text-yellow-400 sm:text-3xl">
                    {auction.movieName}
                </h1>
            </div>

            {/* Outbid refund banner */}
            {isConnected && outbidBalance > 0n && (
                <div className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded border border-amber-500/40 bg-amber-950/30 px-3 py-2">
                    <p className="text-[10px] text-amber-200">
                        You've been outbid on a previous bid.
                        {' '}<span className="font-bold">{Number(formatUnits(outbidBalance, 18)).toLocaleString()} ZERO</span> waiting for you.
                    </p>
                    <button
                        onClick={withdraw}
                        disabled={isWithdrawPending || isWithdrawConfirming}
                        className="inline-flex items-center gap-1 rounded bg-amber-500 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-black hover:bg-amber-400 disabled:opacity-50"
                    >
                        {(isWithdrawPending || isWithdrawConfirming) && <Loader2 className="h-3 w-3 animate-spin" />}
                        Withdraw
                    </button>
                </div>
            )}

            <div className="grid gap-4 md:grid-cols-2">
                {/* Movie cover */}
                <div className="flex flex-col items-center">
                    <div className="relative w-full max-w-sm overflow-hidden rounded border-2 border-yellow-500/40 bg-zinc-950 shadow-[0_0_48px_rgba(168,85,247,0.20)]">
                        <img
                            src={auction.posterUrl}
                            alt={auction.movieName}
                            className="aspect-square w-full object-contain"
                            style={{imageRendering: 'pixelated'}}
                            loading="eager"
                        />
                        {auction.hasAnimation && (
                            <div className="absolute top-2 right-2 rounded bg-purple-500 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-black">
                                Animated · GIF
                            </div>
                        )}
                    </div>
                    <p className="mt-3 text-center text-[10px] text-zinc-500">
                        Movie ID #{auction.movieId} · 1/1 ZEROmovies S2 cover
                    </p>
                </div>

                {/* Bid panel + state */}
                <div className="flex flex-col gap-3">
                    <CountdownTimer secondsLeft={auction.secondsLeft} />

                    <div className="rounded border border-zinc-800 bg-zinc-950/60 p-3">
                        <span className="text-[8px] uppercase tracking-[0.3em] text-zinc-500">Top bid</span>
                        {hasBid ? (
                            <>
                                <p className="font-mono text-2xl font-bold text-yellow-400">
                                    {Number(formatUnits(topBid, 18)).toLocaleString()}
                                    <span className="ml-1 text-[10px] text-zinc-500">ZERO</span>
                                </p>
                                <p className="text-[10px] font-mono text-zinc-400">
                                    by {topBidder.slice(0, 6)}…{topBidder.slice(-4)}
                                    {auction.youAreTopBidder && (
                                        <span className="ml-2 rounded bg-yellow-400 px-1.5 py-0.5 text-[8px] font-bold text-black">
                                            YOU
                                        </span>
                                    )}
                                </p>
                            </>
                        ) : (
                            <>
                                <p className="font-mono text-2xl font-bold text-zinc-500">
                                    No bids yet
                                </p>
                                <p className="text-[10px] text-zinc-600">
                                    Starting at {Number(formatUnits(auction.startPrice, 18)).toLocaleString()} ZERO
                                </p>
                            </>
                        )}
                    </div>

                    <BidPanel auction={auction} onAfterAction={refetch} />
                </div>
            </div>

            {/* Mechanic strip */}
            <div className="mt-6 grid gap-3 sm:grid-cols-3">
                <Stat label="Auction split" value="50% burn" sub="20% S1 holders · 30% FiftyFifty" />
                <Stat label="Anti-snipe" value="+5 min" sub="every bid in last 5 min" />
                <Stat label="Outbid refund" value="Pull-pattern" sub="claim with one click" />
            </div>

            {/* Storytelling blurb */}
            <div className="mt-4 rounded border border-zinc-800 bg-zinc-950/40 p-3 text-[10px] leading-relaxed text-zinc-400">
                <div className="mb-1 flex items-center gap-2">
                    <Trophy className="h-3.5 w-3.5 text-yellow-400" />
                    <span className="font-bold uppercase tracking-[0.3em] text-yellow-400">Why this auction matters</span>
                </div>
                <p>
                    This is the only ZEROmovies S2 cover that ships <span className="font-bold text-purple-300">animated</span> — the
                    rest of the season is pixel-art SVG. The winner gets it permanently the moment{' '}
                    <span className="font-mono">settleAuction</span> lands. The bid is split using S2's own asymmetric
                    tokenomics, so even if you don't win, every bid you place burns ZERO and feeds the cross-season
                    pool that S1 holders accumulate from forever.
                </p>
            </div>
        </div>
    );
}

function Stat({label, value, sub}: {label: string; value: string; sub: string}) {
    return (
        <div className="flex flex-col rounded border border-zinc-800 bg-zinc-950/60 p-2.5">
            <span className="text-[8px] uppercase tracking-[0.3em] text-zinc-500">{label}</span>
            <span className="mt-1 text-base font-mono font-bold text-white">{value}</span>
            <span className="text-[8px] text-zinc-600">{sub}</span>
        </div>
    );
}
