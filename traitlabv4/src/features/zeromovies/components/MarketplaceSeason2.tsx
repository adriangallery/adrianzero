import { useState } from 'react';
import { Loader2, X } from 'lucide-react';
import { useAccount } from 'wagmi';
import { useMovies2Catalog } from '../hooks/useMovies2Catalog';
import { getS2PosterUrl } from '../data/movies2Mock';
import { EnsName } from '@/components/shared/EnsName';

interface MockListing {
  movieId: number;
  seller: string;
  priceFormatted: number;
}
interface MockOffer {
  bidder: string;
  amount: number;
  movieId?: number; // omitted = collection offer
}

const MOCK_LISTINGS: MockListing[] = [
  { movieId: 5,  seller: '0x000000000000000000000000000000000000beef', priceFormatted: 75_000 },
  { movieId: 12, seller: '0x000000000000000000000000000000000000dead', priceFormatted: 60_000 },
  { movieId: 20, seller: '0x000000000000000000000000000000000000face', priceFormatted: 90_000 },
];

const MOCK_OFFERS: MockOffer[] = [
  { bidder: '0x00000000000000000000000000000000c0ffee00', amount: 8_000 }, // collection
  { bidder: '0x000000000000000000000000000000000000cafe', amount: 12_500 }, // collection
  { bidder: '0x00000000000000000000000000000000a11ce000', movieId: 1, amount: 30_000 },
  { bidder: '0x00000000000000000000000000000000b0bbcafe', movieId: 17, amount: 22_000 },
];

/**
 * Preview of what the S2 marketplace will look like once a follow-up
 * marketplace facet (or shared cross-season facet) ships. The shape mirrors
 * what S1's MarketplaceSection renders today, so when the on-chain data is
 * available it's a one-component swap inside MultiSeasonMarketplace.
 */
export function MarketplaceSeason2() {
  const { address } = useAccount();
  const { movies } = useMovies2Catalog();
  const [colOfferAmount, setColOfferAmount] = useState('');

  const movieName = (id: number) => movies.find((m) => m.id === id)?.name ?? `Movie #${id}`;
  // A movie counts as "mystery" in the marketplace UI only when it's still
  // un-revealed on-chain. Once `_maybeReveal` flips `revealed=true`, the
  // poster shows even if the catalog entry was originally seeded mystery.
  const isMystery = (id: number) => {
    const m = movies.find((x) => x.id === id);
    return !!m && m.isMystery && !m.revealed;
  };
  const sortedFeed = [...MOCK_OFFERS].sort((a, b) => b.amount - a.amount);

  return (
    <>
      <div className="mb-4 rounded border border-yellow-500/30 bg-yellow-900/10 px-3 py-2 text-center text-[9px] uppercase tracking-widest text-yellow-300">
        Preview · Mock data — listings + offers will route here when the S2 marketplace facet ships
      </div>

      <div className="mb-2 flex items-center gap-2 text-[9px] uppercase tracking-wider text-zinc-500">
        <span className="rounded bg-zinc-900 px-1.5 py-0.5 text-yellow-400">S2</span>
        <span>Trading floor · proposed 5% fee · 3% burn + 2% to S1 (cross-season)</span>
      </div>

      {/* Listings */}
      <div className="mb-6">
        <h3 className="mb-2 text-[9px] font-bold uppercase tracking-wider text-zinc-500">For Sale</h3>
        <div className="space-y-2">
          {MOCK_LISTINGS.map((l) => {
            const mystery = isMystery(l.movieId);
            return (
              <div
                key={l.movieId}
                className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-900/40 px-4 py-3 opacity-90"
              >
                <div className="flex items-center gap-3 min-w-0">
                  {mystery ? (
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded bg-zinc-950 font-mono text-sm font-bold text-zinc-700">
                      ???
                    </div>
                  ) : (
                    <img
                      src={getS2PosterUrl(l.movieId, false)}
                      alt={movieName(l.movieId)}
                      className="h-10 w-10 rounded object-contain"
                      style={{ imageRendering: 'pixelated' }}
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  )}
                  <div className="min-w-0">
                    <p className="truncate text-xs font-bold text-white">{movieName(l.movieId)}</p>
                    <p className="text-[10px] text-yellow-400">{l.priceFormatted.toLocaleString()} $ZERO</p>
                    <p className="text-[8px] text-zinc-600">
                      Listed by <EnsName address={l.seller} className="text-emerald-400" />
                    </p>
                  </div>
                </div>
                <button
                  disabled
                  className="rounded bg-zinc-800 px-4 py-1.5 text-[10px] font-bold text-zinc-500 disabled:cursor-not-allowed"
                  title="Live once the S2 marketplace facet ships"
                >
                  BUY
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Offers */}
      <div>
        <h3 className="mb-2 text-[9px] font-bold uppercase tracking-wider text-zinc-500">Open Offers</h3>

        <div className="mb-3 space-y-1">
          {sortedFeed.map((row, idx) => {
            const isMine = row.bidder.toLowerCase() === address?.toLowerCase();
            const isCollection = row.movieId === undefined;
            return (
              <div
                key={`${idx}-${row.bidder}`}
                className="flex items-center justify-between rounded border border-zinc-800 bg-zinc-950 px-3 py-2 text-[10px] opacity-90"
              >
                <div className="flex items-center gap-2 min-w-0">
                  {isCollection ? (
                    <span className="flex-shrink-0 rounded bg-zinc-800 px-1.5 py-0.5 text-[8px] font-bold uppercase text-zinc-300">
                      Any S2 Movie
                    </span>
                  ) : (
                    <>
                      {isMystery(row.movieId!) ? (
                        <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded bg-zinc-950 font-mono text-[9px] font-bold text-zinc-700">
                          ???
                        </div>
                      ) : (
                        <img
                          src={getS2PosterUrl(row.movieId!, false)}
                          alt={movieName(row.movieId!)}
                          className="h-6 w-6 flex-shrink-0 rounded object-contain"
                          style={{ imageRendering: 'pixelated' }}
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      )}
                      <span className="truncate text-[9px] font-bold uppercase text-yellow-400">
                        #{row.movieId} · {movieName(row.movieId!)}
                      </span>
                    </>
                  )}
                  <span className="truncate text-zinc-500">
                    <EnsName address={row.bidder} className="text-emerald-400" />
                  </span>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="font-bold text-yellow-400">{row.amount.toLocaleString()} $ZERO</span>
                  {isMine && (
                    <button
                      disabled
                      className="text-zinc-700"
                      title="Live once the S2 marketplace facet ships"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <p className="mb-1 text-[9px] font-bold uppercase tracking-wider text-zinc-500">Make a collection offer</p>
        <div className="flex gap-2">
          <input
            type="number"
            value={colOfferAmount}
            onChange={(e) => setColOfferAmount(e.target.value)}
            placeholder="Amount in $ZERO · any S2 movie"
            disabled
            className="flex-1 rounded border border-zinc-800 bg-zinc-950 px-3 py-2 text-[10px] text-white placeholder:text-zinc-700 focus:border-yellow-600 focus:outline-none disabled:opacity-50"
          />
          <button
            disabled
            className="rounded bg-zinc-800 px-4 py-2 text-[10px] font-bold text-zinc-500 disabled:cursor-not-allowed"
            title="Live once the S2 marketplace facet ships"
          >
            <Loader2 className="hidden h-3 w-3 animate-spin" />
            OFFER
          </button>
        </div>
        <p className="mt-1 text-[8px] text-zinc-700">
          When the marketplace lands, S2 sales will flow the same 50% burn / 20% S1 holders / 30% FiftyFifty split as rent and buy.
        </p>
      </div>
    </>
  );
}
