import { useState } from 'react';
import { ShoppingBag, Loader2 } from 'lucide-react';
import { useAllListings, useCollectionOffers, useBuyListing, useMakeCollectionOffer } from '../hooks/useMarketplace';
import { useZeroBalance } from '../hooks/useZeroBalance';
import { useMoviesCatalog } from '../hooks/useMoviesCatalog';

function short(addr: string): string {
  if (!addr || addr.length < 10) return addr || '?';
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

export function MarketplaceSection() {
  const { listings } = useAllListings();
  const { offers } = useCollectionOffers();
  const { movies } = useMoviesCatalog();
  const { balance } = useZeroBalance();
  const { buy, isPending: isBuying, isConfirming: isBuyConfirming } = useBuyListing();
  const { offer: makeColOffer, isPending: isOffering, isConfirming: isOfferConfirming } = useMakeCollectionOffer();

  const [offerAmount, setOfferAmount] = useState('');

  const getMovieName = (id: number) => movies.find(m => m.id === id)?.name || `Movie #${id}`;

  const handleBuy = (movieId: number) => {
    buy(movieId);
  };

  const handleCollectionOffer = () => {
    const amt = Number(offerAmount);
    if (amt <= 0) return;
    makeColOffer(amt);
    setOfferAmount('');
  };

  if (listings.length === 0 && offers.length === 0) {
    return (
      <div className="mx-auto max-w-6xl px-4 pb-8 sm:px-6">
        <div className="flex items-center gap-2 mb-3">
          <ShoppingBag className="h-4 w-4 text-zinc-600" />
          <h2 className="text-[10px] font-bold uppercase tracking-wider text-zinc-600 sm:text-xs">Marketplace</h2>
        </div>
        <p className="text-[10px] text-zinc-700">No listings or offers yet. Permanent owners can list their movies for sale.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 pb-8 sm:px-6">
      <div className="flex items-center gap-2 mb-4">
        <ShoppingBag className="h-4 w-4 text-red-500" />
        <h2 className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 sm:text-xs">Marketplace</h2>
      </div>

      {/* Listings */}
      {listings.length > 0 && (
        <div className="mb-6">
          <h3 className="mb-2 text-[9px] font-bold uppercase tracking-wider text-zinc-500">For Sale</h3>
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
                  onClick={() => handleBuy(l.movieId)}
                  disabled={isBuying || isBuyConfirming || balance < l.priceFormatted}
                  className="rounded bg-red-600 px-4 py-1.5 text-[10px] font-bold text-white hover:bg-red-500 disabled:bg-zinc-800 disabled:text-zinc-600 transition-colors"
                >
                  {isBuying || isBuyConfirming
                    ? <Loader2 className="h-3 w-3 animate-spin" />
                    : 'BUY'}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Collection Offers */}
      <div>
        <h3 className="mb-2 text-[9px] font-bold uppercase tracking-wider text-zinc-500">Collection Offers</h3>

        {offers.length > 0 && (
          <div className="mb-3 space-y-1">
            {offers.map((o, i) => (
              <div key={i} className="flex items-center justify-between rounded border border-zinc-800 bg-zinc-950 px-3 py-2 text-[10px]">
                <span className="text-zinc-400">{short(o.bidder)}</span>
                <span className="font-bold text-yellow-400">{o.amountFormatted.toLocaleString()} $ZERO</span>
              </div>
            ))}
          </div>
        )}

        {/* Make collection offer */}
        <div className="flex gap-2">
          <input
            type="number"
            value={offerAmount}
            onChange={(e) => setOfferAmount(e.target.value)}
            placeholder="Amount in $ZERO"
            className="flex-1 rounded border border-zinc-800 bg-zinc-950 px-3 py-2 text-[10px] text-white placeholder:text-zinc-700 focus:border-red-600 focus:outline-none"
          />
          <button
            onClick={handleCollectionOffer}
            disabled={isOffering || isOfferConfirming || !offerAmount || Number(offerAmount) <= 0}
            className="rounded bg-zinc-800 px-4 py-2 text-[10px] font-bold text-zinc-300 hover:bg-zinc-700 disabled:text-zinc-600 transition-colors"
          >
            {isOffering || isOfferConfirming
              ? <Loader2 className="h-3 w-3 animate-spin" />
              : 'OFFER'}
          </button>
        </div>
        <p className="mt-1 text-[8px] text-zinc-700">Offer for any movie. $ZERO locked until accepted or cancelled.</p>
      </div>
    </div>
  );
}
