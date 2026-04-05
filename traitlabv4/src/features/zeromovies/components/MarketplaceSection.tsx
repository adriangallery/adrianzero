import { useState } from 'react';
import { ShoppingBag, Loader2, X } from 'lucide-react';
import {
  useAllListings, useCollectionOffers, useBuyListing,
  useMakeCollectionOffer, useMakeOffer, useAcceptCollectionOffer,
} from '../hooks/useMarketplace';
import { useZeroBalance } from '../hooks/useZeroBalance';
import { useMoviesCatalog } from '../hooks/useMoviesCatalog';
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { CONTRACT_ADDRESSES } from '@/config/contracts';
import { ZERO_MOVIES_FACET_ABI } from '@/lib/web3/abi';

function short(addr: string): string {
  if (!addr || addr.length < 10) return addr || '?';
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

export function MarketplaceSection() {
  const { address } = useAccount();
  const { listings } = useAllListings();
  const { offers } = useCollectionOffers();
  const { movies } = useMoviesCatalog();
  const { balance } = useZeroBalance();
  const { buy, isPending: isBuying, isConfirming: isBuyConfirming } = useBuyListing();
  const { offer: makeColOffer, isPending: isOffering, isConfirming: isOfferConfirming } = useMakeCollectionOffer();

  // Cancel collection offer
  const { writeContract: cancelColWrite, data: cancelColHash, isPending: isCancelColPending } = useWriteContract();
  const { isLoading: isCancelColConfirming } = useWaitForTransactionReceipt({ hash: cancelColHash });

  const [colOfferAmount, setColOfferAmount] = useState('');
  const [individualOfferMovie, setIndividualOfferMovie] = useState('');
  const [individualOfferAmount, setIndividualOfferAmount] = useState('');
  const { offer: makeIndOffer, isPending: isIndOffering, isConfirming: isIndOfferConfirming } = useMakeOffer();

  const getMovieName = (id: number) => movies.find(m => m.id === id)?.name || `Movie #${id}`;

  const handleCollectionOffer = () => {
    const amt = Number(colOfferAmount);
    if (amt <= 0) return;
    makeColOffer(amt);
    setColOfferAmount('');
  };

  const handleIndividualOffer = () => {
    const movieId = Number(individualOfferMovie);
    const amt = Number(individualOfferAmount);
    if (movieId <= 0 || amt <= 0) return;
    makeIndOffer(movieId, amt);
    setIndividualOfferMovie('');
    setIndividualOfferAmount('');
  };

  const handleCancelColOffer = (index: number) => {
    cancelColWrite({
      address: CONTRACT_ADDRESSES.ZERO_DIAMOND as `0x${string}`,
      abi: ZERO_MOVIES_FACET_ABI,
      functionName: 'cancelCollectionOffer',
      args: [BigInt(index)],
    });
  };

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

      {/* Make Individual Offer */}
      <div className="mb-6">
        <h3 className="mb-2 text-[9px] font-bold uppercase tracking-wider text-zinc-500">Make Offer on a Movie</h3>
        <div className="flex gap-2">
          <select
            value={individualOfferMovie}
            onChange={(e) => setIndividualOfferMovie(e.target.value)}
            className="w-[140px] rounded border border-zinc-800 bg-zinc-950 px-2 py-2 text-[10px] text-white focus:border-red-600 focus:outline-none"
          >
            <option value="">Select movie</option>
            {movies.map((m) => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
          </select>
          <input
            type="number"
            value={individualOfferAmount}
            onChange={(e) => setIndividualOfferAmount(e.target.value)}
            placeholder="$ZERO"
            className="flex-1 rounded border border-zinc-800 bg-zinc-950 px-3 py-2 text-[10px] text-white placeholder:text-zinc-700 focus:border-red-600 focus:outline-none"
          />
          <button
            onClick={handleIndividualOffer}
            disabled={isIndOffering || isIndOfferConfirming || !individualOfferMovie || !individualOfferAmount}
            className="rounded bg-zinc-800 px-4 py-2 text-[10px] font-bold text-zinc-300 hover:bg-zinc-700 disabled:text-zinc-600 transition-colors"
          >
            {isIndOffering || isIndOfferConfirming ? <Loader2 className="h-3 w-3 animate-spin" /> : 'OFFER'}
          </button>
        </div>
        <p className="mt-1 text-[8px] text-zinc-700">$ZERO locked. Owner can accept. Only highest offer per movie stored.</p>
      </div>

      {/* Collection Offers */}
      <div>
        <h3 className="mb-2 text-[9px] font-bold uppercase tracking-wider text-zinc-500">Collection Offers</h3>

        {offers.length > 0 && (
          <div className="mb-3 space-y-1">
            {offers.map((o, i) => (
              <div key={i} className="flex items-center justify-between rounded border border-zinc-800 bg-zinc-950 px-3 py-2 text-[10px]">
                <span className="text-zinc-400">{short(o.bidder)}</span>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-yellow-400">{o.amountFormatted.toLocaleString()} $ZERO</span>
                  {o.bidder.toLowerCase() === address?.toLowerCase() && (
                    <button
                      onClick={() => handleCancelColOffer(i)}
                      disabled={isCancelColPending || isCancelColConfirming}
                      className="text-zinc-600 hover:text-red-400 transition-colors"
                      title="Cancel offer"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="flex gap-2">
          <input
            type="number"
            value={colOfferAmount}
            onChange={(e) => setColOfferAmount(e.target.value)}
            placeholder="Amount in $ZERO"
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
        <p className="mt-1 text-[8px] text-zinc-700">Offer for any movie. Any permanent owner can accept. $ZERO locked until accepted or cancelled.</p>
      </div>
    </div>
  );
}
