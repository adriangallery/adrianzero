/**
 * Thin wrapper: the original ZEROmoviesModule body verbatim, used as the
 * Season 1 tab inside the new tabbed shell. Keeping it as a separate file
 * (instead of inlining) lets the existing component logic stay untouched.
 */
import { useMoviesCatalog } from '../hooks/useMoviesCatalog';
import { useZeroBalance, useMoviesConfig } from '../hooks/useZeroBalance';
import { useAllRentalStatus, usePendingRewards } from '../hooks/useRentalStatus';
import { useClaimMovieRewards } from '../hooks/useMovieMint';
import { useAllListings } from '../hooks/useMarketplace';
import { useS1LateFeeConfig, deriveS1Overdue } from '../hooks/useS1LateFeeConfig';
import { useMoviesStore } from '../store/moviesStore';
import { MovieCard } from './MovieCard';
import { MovieDetailModal } from './MovieDetailModal';
import { MintSuccessModal } from './MintSuccessModal';

const MYSTERY_IDS = new Set([2, 5, 11, 12, 13, 18, 21, 26]);

function getPosterUrl(movieId: number): string {
  return `/images/zeromovies/${movieId}.png`;
}

function isMystery(movieId: number, minted: boolean): boolean {
  return MYSTERY_IDS.has(movieId) && !minted;
}

export function Season1Tab() {
  const { movies, isLoading, refetch } = useMoviesCatalog();
  const { balance } = useZeroBalance();
  const { priceFormatted, paused, movieCount } = useMoviesConfig();
  const { statusMap, refetch: refetchStatus } = useAllRentalStatus();
  const { listings } = useAllListings();
  const listingMap = new Map(listings.map((l) => [l.movieId, l.priceFormatted]));
  const { pending: pendingRewards } = usePendingRewards();
  const { claim, isPending: isClaimPending } = useClaimMovieRewards();
  const { gracePeriod, feePerDay } = useS1LateFeeConfig();
  const { selectedMovieId, isDetailOpen, selectMovie, closeDetail } = useMoviesStore();

  const selectedMovie = movies.find((m) => m.id === selectedMovieId) || null;
  const selectedMystery = selectedMovie ? isMystery(selectedMovie.id, selectedMovie.minted) : false;
  const selectedRentalStatus = selectedMovie ? statusMap.get(selectedMovie.id) || null : null;

  const handleRefresh = () => {
    refetch();
    refetchStatus();
  };

  const ZERO_ADDR = '0x0000000000000000000000000000000000000000';
  const takenCount = Array.from(statusMap.values()).filter(
    (r) => (r.renter && r.renter !== ZERO_ADDR) || r.permanent,
  ).length;
  const overdueCount = Array.from(statusMap.values()).filter((r) => {
    const { isOverdue } = deriveS1Overdue(r, gracePeriod);
    return isOverdue;
  }).length;
  const graceDays = Math.max(1, Math.round(gracePeriod / 86_400));

  return (
    <>
      <div className="mb-6 text-center">
        <h2 className="text-2xl font-bold tracking-wider text-red-600 sm:text-3xl">ZEROmovies</h2>
        <p className="text-[9px] tracking-[0.3em] text-zinc-600 sm:text-[10px]">
          PART ONE · A four-piece trilogy
        </p>
      </div>

      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap gap-3 text-[9px] uppercase tracking-wider text-zinc-500 sm:text-[10px]">
          <span>Taken: <span className="text-white">{takenCount}/{movieCount}</span></span>
          <span>Overdue: <span className={overdueCount > 0 ? 'text-red-400' : 'text-zinc-400'}>{overdueCount}</span></span>
          <span>Rent: <span className="text-red-400">{priceFormatted.toLocaleString()}</span></span>
          <span>Bal: <span className="text-green-400">{balance.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span></span>
          {paused && <span className="animate-pulse text-yellow-400">SOON</span>}
        </div>
        {pendingRewards > 0 && (
          <button
            onClick={() => claim()}
            disabled={isClaimPending}
            className="rounded-full border border-green-600/30 bg-green-900/20 px-3 py-1 text-[9px] font-bold text-green-400 hover:bg-green-900/40 transition-colors"
          >
            {isClaimPending
              ? '...'
              : `Claim ${pendingRewards.toLocaleString(undefined, { maximumFractionDigits: 0 })} $ZERO`}
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-red-600 border-t-transparent" />
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 sm:gap-3 md:grid-cols-5 lg:grid-cols-7">
          {movies.map((movie) => {
            const r = statusMap.get(movie.id);
            const { isOverdue, daysOverdue } = deriveS1Overdue(r, gracePeriod);
            return (
              <MovieCard
                key={movie.id}
                movie={movie}
                posterUrl={getPosterUrl(movie.id)}
                onClick={() => selectMovie(movie.id)}
                isCurrentlyRented={r?.renter != null && r.renter !== ZERO_ADDR}
                isPermanent={r?.permanent}
                renterAddr={r?.renter}
                listingPrice={listingMap.get(movie.id)}
                isOverdue={isOverdue}
                daysOverdue={daysOverdue}
              />
            );
          })}
        </div>
      )}

      {/* Tokenomics + late-fee mechanic explainers — same layout as S2 so the
          two seasons read consistently */}
      <div className="mt-8 grid gap-3 sm:grid-cols-2">
        <div className="rounded border border-zinc-800 bg-zinc-950/40 p-3">
          <h3 className="text-[10px] font-bold uppercase tracking-[0.3em] text-red-500">Rental tokenomics</h3>
          <p className="mt-1 text-[10px] leading-relaxed text-zinc-400">
            Every rent splits as <span className="text-white">30% burn</span> ·{' '}
            <span className="text-emerald-400">10% to permanent S1 holders</span> · 10% to revenue ·{' '}
            <span className="text-sky-400">50% refundable deposit</span>.
            Buy permanently for 100k $ZERO (80% burn / 10% holders / 10% revenue).
          </p>
        </div>
        <div className="rounded border border-zinc-800 bg-zinc-950/40 p-3">
          <h3 className="text-[10px] font-bold uppercase tracking-[0.3em] text-red-500">Return-the-tape</h3>
          <p className="mt-1 text-[10px] leading-relaxed text-zinc-400">
            {graceDays}-day grace, then{' '}
            <span className="text-red-400">{feePerDay.toLocaleString()} $ZERO/day late fee</span>{' '}
            until the renter returns or upgrades. The NFT itself shows OVERDUE on every marketplace.
            After 30 days you can keep it forever (deposit burned).
          </p>
        </div>
      </div>

      <MovieDetailModal
        movie={selectedMovie}
        posterUrl={selectedMovie && !selectedMystery ? getPosterUrl(selectedMovie.id) : ''}
        open={isDetailOpen}
        onClose={closeDetail}
        onMintSuccess={handleRefresh}
        isMystery={selectedMystery}
        rentalStatus={selectedRentalStatus}
      />
      <MintSuccessModal movieName={selectedMovie?.name || ''} />
    </>
  );
}
