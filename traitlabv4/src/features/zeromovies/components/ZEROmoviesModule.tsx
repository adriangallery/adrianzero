import { Film } from 'lucide-react';
import { useMoviesCatalog } from '../hooks/useMoviesCatalog';
import { useZeroBalance, useMoviesConfig } from '../hooks/useZeroBalance';
import { useMoviesStore } from '../store/moviesStore';
import { MovieCard } from './MovieCard';
import { MovieDetailModal } from './MovieDetailModal';
import { MintSuccessModal } from './MintSuccessModal';

// Poster images — replace with actual URLs when art is ready
function getPosterUrl(movieId: number): string {
  // TODO: Replace with actual poster URLs from CDN or public folder
  return `/images/zeromovies/${movieId}.png`;
}

export function ZEROmoviesModule() {
  const { movies, available, soldOut, isLoading, refetch } = useMoviesCatalog();
  const { balance } = useZeroBalance();
  const { priceFormatted, paused, totalMinted, movieCount } = useMoviesConfig();
  const { selectedMovieId, isDetailOpen, selectMovie, closeDetail } = useMoviesStore();

  const selectedMovie = movies.find((m) => m.id === selectedMovieId) || null;

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <div className="relative overflow-hidden border-b border-red-900/30 bg-gradient-to-b from-red-950/30 to-black px-6 py-8">
        <div className="mx-auto max-w-5xl">
          {/* Logo */}
          <div className="mb-4 flex items-center gap-3">
            <Film className="h-8 w-8 text-red-600" />
            <h1 className="text-2xl font-bold tracking-wider text-red-600">
              ZEROmovies
            </h1>
          </div>

          <p className="mb-4 max-w-md text-xs text-zinc-400">
            Choose your movie. Mint with $ZERO. Each movie is a unique 1/1 AdrianZERO NFT.
          </p>

          {/* Stats Bar */}
          <div className="flex flex-wrap gap-4 text-[10px] uppercase tracking-wider text-zinc-500">
            <span>
              Minted: <span className="text-white">{totalMinted}/{movieCount}</span>
            </span>
            <span>
              Price: <span className="text-red-400">{priceFormatted.toLocaleString()} $ZERO</span>
            </span>
            <span>
              Your Balance: <span className="text-green-400">{balance.toLocaleString(undefined, { maximumFractionDigits: 0 })} $ZERO</span>
            </span>
            {paused && (
              <span className="text-yellow-400">COMING SOON</span>
            )}
          </div>
        </div>
      </div>

      {/* Movie Grid */}
      <div className="mx-auto max-w-5xl px-6 py-8">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-red-600 border-t-transparent" />
          </div>
        ) : movies.length === 0 ? (
          <div className="py-20 text-center text-sm text-zinc-600">
            No movies available yet. Check back soon.
          </div>
        ) : (
          <>
            {/* Available Movies */}
            {available.length > 0 && (
              <section className="mb-10">
                <h2 className="mb-4 text-xs font-bold uppercase tracking-wider text-zinc-400">
                  Available ({available.length})
                </h2>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                  {available.map((movie) => (
                    <MovieCard
                      key={movie.id}
                      movie={movie}
                      posterUrl={getPosterUrl(movie.id)}
                      onClick={() => selectMovie(movie.id)}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* Sold Out Movies */}
            {soldOut.length > 0 && (
              <section>
                <h2 className="mb-4 text-xs font-bold uppercase tracking-wider text-zinc-500">
                  Sold Out ({soldOut.length})
                </h2>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                  {soldOut.map((movie) => (
                    <MovieCard
                      key={movie.id}
                      movie={movie}
                      posterUrl={getPosterUrl(movie.id)}
                      onClick={() => selectMovie(movie.id)}
                    />
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </div>

      {/* Detail Modal */}
      <MovieDetailModal
        movie={selectedMovie}
        posterUrl={selectedMovie ? getPosterUrl(selectedMovie.id) : ''}
        open={isDetailOpen}
        onClose={closeDetail}
        onMintSuccess={refetch}
      />

      {/* Success Modal */}
      <MintSuccessModal
        movieName={selectedMovie?.name || ''}
      />
    </div>
  );
}
