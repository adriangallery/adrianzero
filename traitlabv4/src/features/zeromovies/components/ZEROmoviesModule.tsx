import { useState, useCallback } from 'react';
import { Film, ChevronLeft, ChevronRight } from 'lucide-react';
import { useMoviesCatalog } from '../hooks/useMoviesCatalog';
import { useZeroBalance, useMoviesConfig } from '../hooks/useZeroBalance';
import { useMoviesStore } from '../store/moviesStore';
import { MovieCard } from './MovieCard';
import { MovieDetailModal } from './MovieDetailModal';
import { MintSuccessModal } from './MintSuccessModal';
import type { Movie } from '../types';

// Mystery movies — shown as "?" until minted
const MYSTERY_IDS = new Set([2, 5, 11, 12, 13, 18, 26]);

function getPosterUrl(movieId: number): string {
  return `/images/zeromovies/${movieId}.png`;
}

function isMystery(movieId: number, minted: boolean): boolean {
  return MYSTERY_IDS.has(movieId) && !minted;
}

// ─── 3D Coverflow Slider ───

function CoverflowSlider({
  movies,
  onSelect,
}: {
  movies: Movie[];
  onSelect: (id: number) => void;
}) {
  const [activeIndex, setActiveIndex] = useState(Math.floor(movies.length / 2));

  const goTo = useCallback((idx: number) => {
    setActiveIndex(Math.max(0, Math.min(movies.length - 1, idx)));
  }, [movies.length]);

  if (movies.length === 0) return null;

  // How many cards visible on each side
  const VISIBLE_SIDE = 4;

  return (
    <div className="relative mx-auto w-full overflow-hidden py-8" style={{ perspective: '1200px' }}>
      {/* Navigation arrows */}
      <button
        onClick={() => goTo(activeIndex - 1)}
        disabled={activeIndex === 0}
        className="absolute left-4 top-1/2 z-30 -translate-y-1/2 rounded-full bg-black/60 p-2 text-white transition-colors hover:bg-red-600 disabled:opacity-20 disabled:hover:bg-black/60"
      >
        <ChevronLeft className="h-6 w-6" />
      </button>
      <button
        onClick={() => goTo(activeIndex + 1)}
        disabled={activeIndex === movies.length - 1}
        className="absolute right-4 top-1/2 z-30 -translate-y-1/2 rounded-full bg-black/60 p-2 text-white transition-colors hover:bg-red-600 disabled:opacity-20 disabled:hover:bg-black/60"
      >
        <ChevronRight className="h-6 w-6" />
      </button>

      {/* 3D Cards */}
      <div className="relative flex items-center justify-center" style={{ height: '340px' }}>
        {movies.map((movie, idx) => {
          const offset = idx - activeIndex;
          const absOffset = Math.abs(offset);

          // Hide cards too far away
          if (absOffset > VISIBLE_SIDE) return null;

          const isCenter = offset === 0;
          const mystery = isMystery(movie.id, movie.minted);

          // 3D transforms
          const translateX = offset * 140;
          const translateZ = isCenter ? 80 : -(absOffset * 60);
          const rotateY = offset * -25;
          const scale = isCenter ? 1.15 : Math.max(0.7, 1 - absOffset * 0.1);
          const opacity = isCenter ? 1 : Math.max(0.4, 1 - absOffset * 0.15);
          const zIndex = 20 - absOffset;

          return (
            <div
              key={movie.id}
              onClick={() => {
                if (isCenter) {
                  onSelect(movie.id);
                } else {
                  goTo(idx);
                }
              }}
              className="absolute cursor-pointer transition-all duration-500 ease-out"
              style={{
                transform: `translateX(${translateX}px) translateZ(${translateZ}px) rotateY(${rotateY}deg) scale(${scale})`,
                opacity,
                zIndex,
                transformStyle: 'preserve-3d',
              }}
            >
              <div className={`w-[160px] sm:w-[180px] overflow-hidden rounded-lg border transition-all duration-500 ${
                isCenter ? 'border-red-600/60 shadow-[0_0_40px_rgba(220,38,38,0.3)]' : 'border-zinc-800/50'
              }`}>
                {/* Image */}
                <div className="relative aspect-square w-full bg-zinc-900">
                  {mystery ? (
                    <div className="flex h-full w-full items-center justify-center bg-zinc-950">
                      <div className="flex flex-col items-center">
                        <span className="text-4xl font-bold text-red-600">?</span>
                        <span className="mt-1 text-[7px] uppercase tracking-widest text-zinc-600">Mystery</span>
                      </div>
                    </div>
                  ) : (
                    <MovieCard
                      movie={movie}
                      posterUrl={getPosterUrl(movie.id)}
                      onClick={() => isCenter ? onSelect(movie.id) : goTo(idx)}
                    />
                  )}
                </div>

                {/* Name bar (center card only) */}
                {isCenter && (
                  <div className="bg-zinc-950/90 px-2 py-2 text-center">
                    <p className="truncate text-[10px] font-bold text-white">
                      {mystery ? '???' : movie.name}
                    </p>
                    {!movie.minted && (
                      <p className="mt-0.5 text-[8px] text-red-400">
                        Click to mint
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Dots indicator */}
      <div className="mt-4 flex justify-center gap-1">
        {movies.map((_, idx) => (
          <button
            key={idx}
            onClick={() => goTo(idx)}
            className={`h-1 rounded-full transition-all duration-300 ${
              idx === activeIndex ? 'w-4 bg-red-600' : 'w-1 bg-zinc-700 hover:bg-zinc-500'
            }`}
          />
        ))}
      </div>
    </div>
  );
}

// ─── Main Module ───

export function ZEROmoviesModule() {
  const { movies, available, soldOut, isLoading, refetch } = useMoviesCatalog();
  const { balance } = useZeroBalance();
  const { priceFormatted, paused, totalMinted, movieCount } = useMoviesConfig();
  const { selectedMovieId, isDetailOpen, selectMovie, closeDetail } = useMoviesStore();

  const selectedMovie = movies.find((m) => m.id === selectedMovieId) || null;
  const selectedMystery = selectedMovie ? isMystery(selectedMovie.id, selectedMovie.minted) : false;

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <div className="relative overflow-hidden border-b border-red-900/30 bg-gradient-to-b from-red-950/40 via-red-950/10 to-black px-6 py-10">
        <div className="mx-auto max-w-6xl text-center">
          <Film className="mx-auto mb-3 h-10 w-10 text-red-600" />
          <h1 className="mb-1 text-2xl font-bold tracking-wider text-red-600 sm:text-3xl">
            AdrianZERO Movie
          </h1>
          <p className="mb-4 text-xs tracking-[0.3em] text-zinc-500">
            PART ONE
          </p>
          <p className="mx-auto mb-6 max-w-md text-[11px] leading-relaxed text-zinc-400">
            Choose your movie. Mint with $ZERO. Each movie is a unique 1/1 AdrianZERO NFT.
            <br />
            <span className="text-zinc-600">A four-piece trilogy.</span>
          </p>

          <div className="flex flex-wrap justify-center gap-4 text-[10px] uppercase tracking-wider text-zinc-500">
            <span>
              Minted: <span className="text-white">{totalMinted}/{movieCount}</span>
            </span>
            <span>
              Price: <span className="text-red-400">{priceFormatted.toLocaleString()} $ZERO</span>
            </span>
            <span>
              Balance: <span className="text-green-400">{balance.toLocaleString(undefined, { maximumFractionDigits: 0 })} $ZERO</span>
            </span>
            {paused && (
              <span className="animate-pulse text-yellow-400">COMING SOON</span>
            )}
          </div>
        </div>
      </div>

      {/* 3D Coverflow */}
      <div className="mx-auto max-w-6xl">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-red-600 border-t-transparent" />
          </div>
        ) : movies.length === 0 ? (
          <div className="py-20 text-center text-sm text-zinc-600">
            No movies available yet. Check back soon.
          </div>
        ) : (
          <CoverflowSlider movies={movies} onSelect={selectMovie} />
        )}
      </div>

      {/* Rented section (below coverflow) */}
      {soldOut.length > 0 && (
        <div className="mx-auto max-w-6xl px-6 pb-10">
          <h2 className="mb-3 text-xs font-bold uppercase tracking-wider text-zinc-600">
            Rented ({soldOut.length})
          </h2>
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide" style={{ scrollbarWidth: 'none' }}>
            {soldOut.map((movie) => (
              <div key={movie.id} className="flex-shrink-0 w-[100px]">
                <MovieCard
                  movie={movie}
                  posterUrl={getPosterUrl(movie.id)}
                  onClick={() => selectMovie(movie.id)}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Detail Modal */}
      <MovieDetailModal
        movie={selectedMovie}
        posterUrl={selectedMovie && !selectedMystery ? getPosterUrl(selectedMovie.id) : ''}
        open={isDetailOpen}
        onClose={closeDetail}
        onMintSuccess={refetch}
        isMystery={selectedMystery}
      />

      {/* Success Modal */}
      <MintSuccessModal movieName={selectedMovie?.name || ''} />

      <style>{`
        .scrollbar-hide::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  );
}
