import { useState } from 'react';
import { ShoppingBag, Loader2, X } from 'lucide-react';
import {
  useAllListings, useCollectionOffers, useAllIndividualOffers, useBuyListing,
  useMakeCollectionOffer, useCancelOffer,
} from '../hooks/useMarketplace';
import { useZeroBalance } from '../hooks/useZeroBalance';
import { useMoviesCatalog } from '../hooks/useMoviesCatalog';
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { CONTRACT_ADDRESSES } from '@/config/contracts';
import { ZERO_MOVIES_FACET_ABI } from '@/lib/web3/abi';
import { EnsName } from '@/components/shared/EnsName';

type FeedRow =
  | { kind: 'collection'; index: number; bidder: string; amount: number }
  | { kind: 'individual'; movieId: number; bidder: string; amount: number };

export function MarketplaceSection() {
  const { address } = useAccount();
  const { listings } = useAllListings();
  const { offers: colOffers } = useCollectionOffers();
  const { movies } = useMoviesCatalog();
  const { offers: indOffers } = useAllIndividualOffers(movies.map(m => m.id));
  const { balance } = useZeroBalance();
  const { buy, isPending: isBuying, isConfirming: isBuyConfirming } = useBuyListing();
  const { offer: makeColOffer, isPending: isOffering, isConfirming: isOfferConfirming } = useMakeCollectionOffer();
  const { cancel: cancelIndOffer, isPending: isCancelIndPending, isConfirming: isCancelIndConfirming } = useCancelOffer();

  // Cancel collection offer
  const { writeContract: cancelColWrite, data: cancelColHash, isPending: isCancelColPending } = useWriteContract();
  const { isLoading: isCancelColConfirming } = useWaitForTransactionReceipt({ hash: cancelColHash });

  const [colOfferAmount, setColOfferAmount] = useState('');
  const getMovieName = (id: number) => movies.find(m => m.id === id)?.name || `Movie #${id}`;

  const handleCollectionOffer = () => {
    const amt = Number(colOfferAmount);
    if (amt <= 0) return;
    makeColOffer(amt);
    setColOfferAmount('');
  };

  const handleCancelColOffer = (index: number) => {
    cancelColWrite({
      address: CONTRACT_ADDRESSES.ZERO_DIAMOND as `0x${string}`,
      abi: ZERO_MOVIES_FACET_ABI,
      functionName: 'cancelCollectionOffer',
      args: [BigInt(index)],
    });
  };

  const feed: FeedRow[] = [
    ...colOffers.map((o, i): FeedRow => ({ kind: 'collection', index: i, bidder: o.bidder, amount: o.amountFormatted })),
    ...indOffers.map((o): FeedRow => ({ kind: 'individual', movieId: o.movieId, bidder: o.bidder, amount: o.amountFormatted })),
  ].sort((a, b) => b.amount - a.amount);

  const isCancelling = isCancelColPending || isCancelColConfirming || isCancelIndPending || isCancelIndConfirming;

  return (
    <div className="mx-auto max-w-6xl px-4 pb-8 sm:px-6">
      <div className="flex items-center gap-2 mb-4">
        <ShoppingBag className="h-4 w-4 text-red-500" />
        <h2 className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 sm:text-xs">
          Marketplace <span className="text-zinc-600 font-normal">· 5% fee (3% burn + 2% holders)</span>
        </h2>
      </div>

      {/* Listings */}
      <div className="mb-6">
        <h3 className="mb-2 text-[9px] font-bold uppercase tracking-wider text-zinc-500">For Sale</h3>
        {listings.length > 0 ? (
          <div className="space-y-2">
            {listings.map((l) => (
              <div key={l.movieId} className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-900/50 px-4 py-3">
                <div className="flex items-center gap-3">
                  <img
                    src={`/images/zeromovies/${l.movieId}.png`}
                    alt={getMovieName(l.movieId)}
                    className="h-10 w-10 rounded object-contain"
                    style={{ imageRendering: 'pixelated' }}
                  />
                  <div>
                    <p className="text-xs font-bold text-white">{getMovieName(l.movieId)}</p>
                    <p className="text-[10px] text-yellow-400">{l.priceFormatted.toLocaleString()} $ZERO</p>
                  </div>
                </div>
                <button
                  onClick={() => buy(l.movieId)}
                  disabled={isBuying || isBuyConfirming || balance < l.priceFormatted}
                  className="rounded bg-red-600 px-4 py-1.5 text-[10px] font-bold text-white hover:bg-red-500 disabled:bg-zinc-800 disabled:text-zinc-600 transition-colors"
                >
                  {isBuying || isBuyConfirming ? <Loader2 className="h-3 w-3 animate-spin" /> : 'BUY'}
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-[10px] text-zinc-700">No movies listed for sale yet.</p>
        )}
      </div>

      {/* All Offers — individual + collection merged */}
      <div>
        <h3 className="mb-2 text-[9px] font-bold uppercase tracking-wider text-zinc-500">Open Offers</h3>

        {feed.length > 0 ? (
          <div className="mb-3 space-y-1">
            {feed.map((row) => {
              const isMine = row.bidder.toLowerCase() === address?.toLowerCase();
              return (
                <div
                  key={row.kind === 'collection' ? `col-${row.index}` : `ind-${row.movieId}`}
                  className="flex items-center justify-between rounded border border-zinc-800 bg-zinc-950 px-3 py-2 text-[10px]"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    {row.kind === 'individual' ? (
                      <>
                        <img
                          src={`/images/zeromovies/${row.movieId}.png`}
                          alt={getMovieName(row.movieId)}
                          className="h-6 w-6 rounded object-contain flex-shrink-0"
                          style={{ imageRendering: 'pixelated' }}
                        />
                        <span className="truncate text-[9px] font-bold uppercase text-red-400">#{row.movieId} · {getMovieName(row.movieId)}</span>
                      </>
                    ) : (
                      <span className="flex-shrink-0 rounded bg-zinc-800 px-1.5 py-0.5 text-[8px] font-bold uppercase text-zinc-300">Any Movie</span>
                    )}
                    <span className="truncate text-zinc-500"><EnsName address={row.bidder} className="text-emerald-400" /></span>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="font-bold text-yellow-400">{row.amount.toLocaleString()} $ZERO</span>
                    {isMine && (
                      <button
                        onClick={() => row.kind === 'collection' ? handleCancelColOffer(row.index) : cancelIndOffer(row.movieId)}
                        disabled={isCancelling}
                        className="text-zinc-600 hover:text-red-400 transition-colors disabled:opacity-50"
                        title="Cancel offer"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="mb-3 text-[10px] text-zinc-700">No open offers yet. Be first.</p>
        )}

        <p className="mb-1 text-[9px] font-bold uppercase tracking-wider text-zinc-500">Make a collection offer</p>
        <div className="flex gap-2">
          <input
            type="number"
            value={colOfferAmount}
            onChange={(e) => setColOfferAmount(e.target.value)}
            placeholder="Amount in $ZERO · any movie"
            className="flex-1 rounded border border-zinc-800 bg-zinc-950 px-3 py-2 text-[10px] text-white placeholder:text-zinc-700 focus:border-red-600 focus:outline-none"
          />
          <button
            onClick={handleCollectionOffer}
            disabled={isOffering || isOfferConfirming || !colOfferAmount || Number(colOfferAmount) <= 0}
            className="rounded bg-zinc-800 px-4 py-2 text-[10px] font-bold text-zinc-300 hover:bg-zinc-700 disabled:text-zinc-600 transition-colors"
          >
            {isOffering || isOfferConfirming ? <Loader2 className="h-3 w-3 animate-spin" /> : 'OFFER'}
          </button>
        </div>
        <p className="mt-1 text-[8px] text-zinc-700">Individual offers: open a movie card. Collection offers: any owner can accept. $ZERO locked until accepted or cancelled.</p>
      </div>
    </div>
  );
}
