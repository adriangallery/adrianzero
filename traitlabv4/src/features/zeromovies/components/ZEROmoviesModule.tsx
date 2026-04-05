import { useMoviesCatalog } from '../hooks/useMoviesCatalog';
import { useZeroBalance, useMoviesConfig } from '../hooks/useZeroBalance';
import { useAllRentalStatus, usePendingRewards } from '../hooks/useRentalStatus';
import { useClaimMovieRewards } from '../hooks/useMovieMint';
import { useAllListings } from '../hooks/useMarketplace';
import { useMoviesStore } from '../store/moviesStore';
import { MovieCard } from './MovieCard';
import { MovieDetailModal } from './MovieDetailModal';
import { MintSuccessModal } from './MintSuccessModal';
import { MarketplaceSection } from './MarketplaceSection';

const MYSTERY_IDS = new Set([2, 5, 11, 12, 13, 18, 21, 26]);

function getPosterUrl(movieId: number): string {
  return `/images/zeromovies/${movieId}.png`;
}

function isMystery(movieId: number, minted: boolean): boolean {
  return MYSTERY_IDS.has(movieId) && !minted;
}

export function ZEROmoviesModule() {
  const { movies, isLoading, refetch } = useMoviesCatalog();
  const { balance } = useZeroBalance();
  const { priceFormatted, paused, movieCount } = useMoviesConfig();
  const { statusMap, refetch: refetchStatus } = useAllRentalStatus();
  const { listings } = useAllListings();
  const listingMap = new Map(listings.map(l => [l.movieId, l.priceFormatted]));
  const { pending: pendingRewards } = usePendingRewards();
  const { claim, isPending: isClaimPending } = useClaimMovieRewards();
  const { selectedMovieId, isDetailOpen, selectMovie, closeDetail } = useMoviesStore();

  const selectedMovie = movies.find((m) => m.id === selectedMovieId) || null;
  const selectedMystery = selectedMovie ? isMystery(selectedMovie.id, selectedMovie.minted) : false;
  const selectedRentalStatus = selectedMovie ? statusMap.get(selectedMovie.id) || null : null;

  const handleRefresh = () => { refetch(); refetchStatus(); };

  const takenCount = Array.from(statusMap.values()).filter(r => (r.renter && r.renter !== '0x0000000000000000000000000000000000000000') || r.permanent).length;

  return (
    <div className="min-h-screen bg-black">

      {/* 1. MOVIE GRID — first thing users see */}
      <div className="mx-auto max-w-6xl px-4 pt-20 pb-8 sm:px-6 sm:pt-24">
        {/* Title + stats */}
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold tracking-wider text-red-600 sm:text-3xl">ZEROmovies</h1>
          <p className="text-[9px] tracking-[0.3em] text-zinc-600 sm:text-[10px]">PART ONE · A four-piece trilogy</p>
        </div>

        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap gap-3 text-[9px] uppercase tracking-wider text-zinc-500 sm:text-[10px]">
            <span>Taken: <span className="text-white">{takenCount}/{movieCount}</span></span>
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
              {isClaimPending ? '...' : `Claim ${pendingRewards.toLocaleString(undefined, { maximumFractionDigits: 0 })} $ZERO`}
            </button>
          )}
        </div>

        {/* Grid */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-red-600 border-t-transparent" />
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 sm:gap-3 md:grid-cols-5 lg:grid-cols-7">
            {movies.map((movie) => {
              const r = statusMap.get(movie.id);
              return (
                <MovieCard
                  key={movie.id}
                  movie={movie}
                  posterUrl={getPosterUrl(movie.id)}
                  onClick={() => selectMovie(movie.id)}
                  isCurrentlyRented={r?.renter != null && r.renter !== '0x0000000000000000000000000000000000000000'}
                  isPermanent={r?.permanent}
                  renterAddr={r?.renter}
                  listingPrice={listingMap.get(movie.id)}
                />
              );
            })}
          </div>
        )}
      </div>

      {/* 2. MARKETPLACE */}
      <MarketplaceSection />

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

      <style>{`.scrollbar-hide::-webkit-scrollbar { display: none; }`}</style>
    </div>
  );
}
