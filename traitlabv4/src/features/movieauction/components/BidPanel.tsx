import {useEffect, useState} from 'react';
import {useAccount} from 'wagmi';
import {parseUnits, formatUnits} from 'viem';
import {Loader2} from 'lucide-react';
import {useZeroBalance} from '@/features/zeromovies/hooks/useZeroBalance';
import type {AuctionState} from '../hooks/useAuction';
import {
    useApproveZeroForAuction,
    usePlaceBid,
    useSettleAuction,
    useZeroAllowanceForAuction,
} from '../hooks/useAuctionActions';

interface BidPanelProps {
    auction: AuctionState;
    onAfterAction?: () => void;
}

export function BidPanel({auction, onAfterAction}: BidPanelProps) {
    const {address, isConnected} = useAccount();
    const {balanceRaw: zeroBalance} = useZeroBalance();
    const {allowance, refetch: refetchAllowance} = useZeroAllowanceForAuction();

    const minNextZ = Number(formatUnits(auction.minNextBid, 18));
    const [bidInput, setBidInput] = useState<string>(minNextZ.toString());

    useEffect(() => {
        // Reset input to current minimum when the on-chain min changes (top bid moved).
        setBidInput(minNextZ.toString());
    }, [auction.auctionId, minNextZ]);

    const {approve, isPending: isApprovePending, isConfirming: isApproveConfirming, isConfirmed: isApproveConfirmed} = useApproveZeroForAuction();
    const {placeBid, isPending: isBidPending, isConfirming: isBidConfirming, isConfirmed: isBidConfirmed, error: bidError} = usePlaceBid();
    const {settle, isPending: isSettlePending, isConfirming: isSettleConfirming, isConfirmed: isSettleConfirmed} = useSettleAuction();

    useEffect(() => {
        if (isApproveConfirmed) refetchAllowance();
    }, [isApproveConfirmed, refetchAllowance]);

    useEffect(() => {
        if (isBidConfirmed || isSettleConfirmed) {
            refetchAllowance();
            onAfterAction?.();
        }
    }, [isBidConfirmed, isSettleConfirmed, refetchAllowance, onAfterAction]);

    if (!isConnected || !address) {
        return (
            <div className="rounded border border-zinc-800 bg-zinc-950/60 p-4 text-center text-[10px] uppercase tracking-widest text-zinc-500">
                Connect wallet to bid
            </div>
        );
    }

    const isEnded = !auction.isLive;
    const winnerHere = auction.youAreTopBidder && isEnded;
    const noBids = auction.topBid === 0n;

    if (isEnded) {
        return (
            <div className="rounded border border-zinc-800 bg-zinc-950/60 p-4 text-center">
                <p className="text-[10px] uppercase tracking-widest text-zinc-500">Auction ended</p>
                {noBids ? (
                    <p className="mt-1 text-[10px] text-zinc-600">No bids — ready to be cancelled by the owner.</p>
                ) : (
                    <>
                        <p className="mt-1 text-sm text-white">
                            Winner: <span className={winnerHere ? 'text-yellow-400' : ''}>{auction.topBidder.slice(0, 6)}…{auction.topBidder.slice(-4)}</span>
                            {winnerHere && <span className="ml-2 rounded bg-yellow-400 px-1.5 py-0.5 text-[8px] font-bold text-black">YOU</span>}
                        </p>
                        <p className="mt-1 text-xs text-zinc-400">at {Number(formatUnits(auction.topBid, 18)).toLocaleString()} ZERO</p>
                        {auction.statusCode === 1 && (
                            <button
                                onClick={() => settle(auction.auctionId)}
                                disabled={isSettlePending || isSettleConfirming}
                                className="mt-3 inline-flex items-center gap-1 rounded border border-yellow-500 bg-yellow-500/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-yellow-400 hover:bg-yellow-500/20 disabled:opacity-50"
                            >
                                {(isSettlePending || isSettleConfirming) && <Loader2 className="h-3 w-3 animate-spin" />}
                                Settle auction → mint movie to winner
                            </button>
                        )}
                    </>
                )}
            </div>
        );
    }

    const balanceShort = zeroBalance < auction.minNextBid;
    let bidAmountWei = 0n;
    let parseErr: string | null = null;
    try {
        bidAmountWei = parseUnits(bidInput || '0', 18);
    } catch {
        parseErr = 'Invalid amount';
    }
    const tooLow = !parseErr && bidAmountWei < auction.minNextBid;
    const needsApproval = bidAmountWei > allowance;
    const canBid = !parseErr && !tooLow && !balanceShort && !needsApproval;

    return (
        <div className="rounded border border-zinc-800 bg-zinc-950/60 p-4">
            <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
                <div>
                    <span className="text-[8px] uppercase tracking-[0.3em] text-zinc-500">Min next bid</span>
                    <p className="font-mono text-lg font-bold text-yellow-400">
                        {minNextZ.toLocaleString(undefined, {maximumFractionDigits: 2})} <span className="text-[10px] text-zinc-500">ZERO</span>
                    </p>
                </div>
                <div className="text-right">
                    <span className="text-[8px] uppercase tracking-[0.3em] text-zinc-500">Your balance</span>
                    <p className="text-[11px] font-mono text-zinc-300">
                        {Number(formatUnits(zeroBalance, 18)).toLocaleString()} ZERO
                    </p>
                </div>
            </div>

            <label className="block">
                <span className="text-[8px] uppercase tracking-widest text-zinc-500">Bid amount (ZERO)</span>
                <div className="mt-1 flex items-center gap-2">
                    <input
                        type="number"
                        inputMode="decimal"
                        value={bidInput}
                        onChange={(e) => setBidInput(e.target.value)}
                        min={minNextZ}
                        step={Math.max(1, Math.floor(minNextZ / 100))}
                        className="w-full rounded border border-zinc-800 bg-black px-3 py-2 text-base text-white outline-none focus:border-yellow-500"
                    />
                    <button
                        onClick={() => setBidInput(minNextZ.toString())}
                        className="shrink-0 rounded border border-zinc-700 px-2 py-2 text-[9px] uppercase tracking-wider text-zinc-400 hover:border-zinc-500"
                    >
                        Min
                    </button>
                </div>
            </label>

            {parseErr && <p className="mt-2 text-[10px] text-red-400">{parseErr}</p>}
            {tooLow && !parseErr && <p className="mt-2 text-[10px] text-red-400">Below minimum next bid</p>}
            {balanceShort && <p className="mt-2 text-[10px] text-red-400">Insufficient $ZERO balance</p>}

            <div className="mt-3 flex flex-col gap-2">
                {needsApproval ? (
                    <button
                        onClick={() => approve(bidAmountWei * 5n)} // 5x headroom for follow-up bids
                        disabled={isApprovePending || isApproveConfirming || balanceShort || !!parseErr}
                        className="inline-flex items-center justify-center gap-2 rounded bg-purple-500 px-4 py-2.5 text-sm font-bold uppercase tracking-wider text-black hover:bg-purple-400 disabled:opacity-50"
                    >
                        {(isApprovePending || isApproveConfirming) && <Loader2 className="h-4 w-4 animate-spin" />}
                        Approve {Number(formatUnits(bidAmountWei * 5n, 18)).toLocaleString()} ZERO
                    </button>
                ) : (
                    <button
                        onClick={() => placeBid(auction.auctionId, bidAmountWei)}
                        disabled={!canBid || isBidPending || isBidConfirming}
                        className="inline-flex items-center justify-center gap-2 rounded bg-yellow-500 px-4 py-2.5 text-sm font-bold uppercase tracking-wider text-black hover:bg-yellow-400 disabled:opacity-50"
                    >
                        {(isBidPending || isBidConfirming) && <Loader2 className="h-4 w-4 animate-spin" />}
                        Place bid
                    </button>
                )}
                {bidError && <p className="text-[10px] text-red-400">{bidError.message?.split('\n')[0]}</p>}
            </div>
        </div>
    );
}
