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
      <div className="mb-4 rounded border border-yellow-500/30 bg-yellow-900/10 px-3 py-2 text-center text-[12px] uppercase tracking-widest text-yellow-300">
        Preview · Mock data — listings + offers will route here when the S2 marketplace facet ships
      </div>

      <div className="mb-2 flex items-center gap-2 text-[12px] uppercase tracking-wider text-mute">
        <span className="rounded bg-panel px-1.5 py-0.5 text-yellow-400">S2</span>
        <span>Trading floor · proposed 5% fee · 3% burn + 2% to S1 (cross-season)</span>
      </div>

      {/* Listings */}
      <div className="mb-6">
        <h3 className="mb-2 text-[12px] font-bold uppercase tracking-wider text-mute">For Sale</h3>
        <div className="space-y-2">
          {MOCK_LISTINGS.map((l) => {
            const mystery = isMystery(l.movieId);
            return (
              <div
                key={l.movieId}
                className="flex items-center justify-between rounded-lg border border-line bg-panel px-4 py-3 opacity-90"
              >
                <div className="flex items-center gap-3 min-w-0">
                  {mystery ? (
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded bg-panel font-mono text-sm font-bold text-mute">
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
                    <p className="truncate text-xs font-bold text-fg">{movieName(l.movieId)}</p>
                    <p className="text-[13px] text-yellow-400">{l.priceFormatted.toLocaleString()} $ZERO</p>
                    <p className="text-[11px] text-mute">
                      Listed by <EnsName address={l.seller} className="text-ok" />
                    </p>
                  </div>
                </div>
                <button
                  disabled
                  className="rounded bg-line px-4 py-1.5 text-[13px] font-bold text-mute disabled:cursor-not-allowed"
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
        <h3 className="mb-2 text-[12px] font-bold uppercase tracking-wider text-mute">Open Offers</h3>

        <div className="mb-3 space-y-1">
          {sortedFeed.map((row, idx) => {
            const isMine = row.bidder.toLowerCase() === address?.toLowerCase();
            const isCollection = row.movieId === undefined;
            return (
              <div
                key={`${idx}-${row.bidder}`}
                className="flex items-center justify-between rounded border border-line bg-panel px-3 py-2 text-[13px] opacity-90"
              >
                <div className="flex items-center gap-2 min-w-0">
                  {isCollection ? (
                    <span className="flex-shrink-0 rounded bg-line px-1.5 py-0.5 text-[11px] font-bold uppercase text-fg">
                      Any S2 Movie
                    </span>
                  ) : (
                    <>
                      {isMystery(row.movieId!) ? (
                        <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded bg-panel font-mono text-[12px] font-bold text-mute">
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
                      <span className="truncate text-[12px] font-bold uppercase text-yellow-400">
                        #{row.movieId} · {movieName(row.movieId!)}
                      </span>
                    </>
                  )}
                  <span className="truncate text-mute">
                    <EnsName address={row.bidder} className="text-ok" />
                  </span>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="font-bold text-yellow-400">{row.amount.toLocaleString()} $ZERO</span>
                  {isMine && (
                    <button
                      disabled
                      className="text-mute"
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

        <p className="mb-1 text-[12px] font-bold uppercase tracking-wider text-mute">Make a collection offer</p>
        <div className="flex gap-2">
          <input
            type="number"
            value={colOfferAmount}
            onChange={(e) => setColOfferAmount(e.target.value)}
            placeholder="Amount in $ZERO · any S2 movie"
            disabled
            className="flex-1 rounded border border-line bg-panel px-3 py-2 text-[13px] text-fg placeholder:text-mute focus:border-yellow-600 focus:outline-none disabled:opacity-50"
          />
          <button
            disabled
            className="rounded bg-line px-4 py-2 text-[13px] font-bold text-mute disabled:cursor-not-allowed"
            title="Live once the S2 marketplace facet ships"
          >
            <Loader2 className="hidden h-3 w-3 animate-spin" />
            OFFER
          </button>
        </div>
        <p className="mt-1 text-[11px] text-mute">
          When the marketplace lands, S2 sales will flow the same 50% burn / 20% S1 holders / 30% FiftyFifty split as rent and buy.
        </p>
      </div>
    </>
  );
}
