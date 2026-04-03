import { useState, useCallback, useRef } from 'react';
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

// ─── 3D Coverflow Slider with touch/swipe ───

function CoverflowSlider({
  movies,
  onSelect,
}: {
  movies: Movie[];
  onSelect: (id: number) => void;
}) {
  const [activeIndex, setActiveIndex] = useState(Math.floor(movies.length / 2));
  const touchStartX = useRef(0);
  const touchDelta = useRef(0);
  const isDragging = useRef(false);

  const goTo = useCallback((idx: number) => {
    setActiveIndex(Math.max(0, Math.min(movies.length - 1, idx)));
  }, [movies.length]);

  // Touch handlers
  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchDelta.current = 0;
    isDragging.current = true;
  };

  const onTouchMove = (e: React.TouchEvent) => {
    if (!isDragging.current) return;
    touchDelta.current = e.touches[0].clientX - touchStartX.current;
  };

  const onTouchEnd = () => {
    isDragging.current = false;
    const threshold = 40;
    if (touchDelta.current > threshold) {
      goTo(activeIndex - 1);
    } else if (touchDelta.current < -threshold) {
      goTo(activeIndex + 1);
    }
    touchDelta.current = 0;
  };

  // Mouse drag handlers (desktop)
  const onMouseDown = (e: React.MouseEvent) => {
    touchStartX.current = e.clientX;
    touchDelta.current = 0;
    isDragging.current = true;
  };

  const onMouseMove = (e: React.MouseEvent) => {
    if (!isDragging.current) return;
    touchDelta.current = e.clientX - touchStartX.current;
  };

  const onMouseUp = () => {
    if (!isDragging.current) return;
    isDragging.current = false;
    const threshold = 40;
    if (touchDelta.current > threshold) {
      goTo(activeIndex - 1);
    } else if (touchDelta.current < -threshold) {
      goTo(activeIndex + 1);
    }
    touchDelta.current = 0;
  };

  if (movies.length === 0) return null;

  const VISIBLE_SIDE = 4;

  return (
    <div className="relative mx-auto w-full select-none overflow-hidden py-6 sm:py-8" style={{ perspective: '1200px' }}>
      {/* Navigation arrows — hidden on mobile, touch is primary */}
      <button
        onClick={() => goTo(activeIndex - 1)}
        disabled={activeIndex === 0}
        className="absolute left-2 top-1/2 z-30 hidden -translate-y-1/2 rounded-full bg-black/60 p-2 text-white transition-colors hover:bg-red-600 disabled:opacity-20 sm:block"
      >
        <ChevronLeft className="h-5 w-5" />
      </button>
      <button
        onClick={() => goTo(activeIndex + 1)}
        disabled={activeIndex === movies.length - 1}
        className="absolute right-2 top-1/2 z-30 hidden -translate-y-1/2 rounded-full bg-black/60 p-2 text-white transition-colors hover:bg-red-600 disabled:opacity-20 sm:block"
      >
        <ChevronRight className="h-5 w-5" />
      </button>

      {/* 3D Cards — swipeable area */}
      <div
        className="relative flex touch-pan-y items-center justify-center"
        style={{ height: '300px' }}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
      >
        {movies.map((movie, idx) => {
          const offset = idx - activeIndex;
          const absOffset = Math.abs(offset);

          if (absOffset > VISIBLE_SIDE) return null;

          const isCenter = offset === 0;
          const mystery = isMystery(movie.id, movie.minted);

          // Responsive card spacing
          const cardGap = window.innerWidth < 640 ? 90 : 140;
          const translateX = offset * cardGap;
          const translateZ = isCenter ? 60 : -(absOffset * 50);
          const rotateY = offset * (window.innerWidth < 640 ? -30 : -25);
          const scale = isCenter ? 1.1 : Math.max(0.65, 1 - absOffset * 0.12);
          const cardOpacity = isCenter ? 1 : Math.max(0.35, 1 - absOffset * 0.18);
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
                opacity: cardOpacity,
                zIndex,
                transformStyle: 'preserve-3d',
              }}
            >
              <div className={`w-[120px] sm:w-[160px] md:w-[180px] overflow-hidden rounded-lg border transition-all duration-500 ${
                isCenter ? 'border-red-600/60 shadow-[0_0_40px_rgba(220,38,38,0.3)]' : 'border-zinc-800/50'
              }`}>
                <div className="relative aspect-square w-full bg-zinc-900">
                  {mystery ? (
                    <div className="flex h-full w-full items-center justify-center bg-zinc-950">
                      <div className="flex flex-col items-center">
                        <span className="text-3xl font-bold text-red-600 sm:text-4xl">?</span>
                        <span className="mt-1 text-[6px] uppercase tracking-widest text-zinc-600 sm:text-[7px]">Mystery</span>
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
                  <div className="bg-zinc-950/90 px-2 py-1.5 text-center sm:py-2">
                    <p className="truncate text-[9px] font-bold text-white sm:text-[10px]">
                      {mystery ? '???' : movie.name}
                    </p>
                    {!movie.minted && (
                      <p className="mt-0.5 text-[7px] text-red-400 sm:text-[8px]">
                        Tap to mint
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Counter + swipe hint on mobile */}
      <div className="mt-2 text-center">
        <p className="text-[10px] text-zinc-500">
          {activeIndex + 1} / {movies.length}
        </p>
        <p className="mt-1 text-[8px] text-zinc-700 sm:hidden">
          Swipe to browse
        </p>
      </div>

      {/* Dots indicator */}
      <div className="mt-3 flex justify-center gap-1">
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
  const { movies, soldOut, isLoading, refetch } = useMoviesCatalog();
  const { balance } = useZeroBalance();
  const { priceFormatted, paused, totalMinted, movieCount } = useMoviesConfig();
  const { selectedMovieId, isDetailOpen, selectMovie, closeDetail } = useMoviesStore();

  const selectedMovie = movies.find((m) => m.id === selectedMovieId) || null;
  const selectedMystery = selectedMovie ? isMystery(selectedMovie.id, selectedMovie.minted) : false;

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <div className="relative overflow-hidden border-b border-red-900/30 bg-gradient-to-b from-red-950/40 via-red-950/10 to-black px-4 py-8 sm:px-6 sm:py-10">
        <div className="mx-auto max-w-6xl text-center">
          <Film className="mx-auto mb-3 h-8 w-8 text-red-600 sm:h-10 sm:w-10" />
          <h1 className="mb-1 text-xl font-bold tracking-wider text-red-600 sm:text-3xl">
            AdrianZERO Movie
          </h1>
          <p className="mb-3 text-[10px] tracking-[0.3em] text-zinc-500 sm:mb-4 sm:text-xs">
            PART ONE
          </p>
          <p className="mx-auto mb-4 max-w-md text-[10px] leading-relaxed text-zinc-400 sm:mb-6 sm:text-[11px]">
            Choose your movie. Mint with $ZERO. Each movie is a unique 1/1 AdrianZERO NFT.
            <br />
            <span className="text-zinc-600">A four-piece trilogy.</span>
          </p>

          <div className="flex flex-wrap justify-center gap-3 text-[9px] uppercase tracking-wider text-zinc-500 sm:gap-4 sm:text-[10px]">
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

      {/* Rented section */}
      {soldOut.length > 0 && (
        <div className="mx-auto max-w-6xl px-4 pb-10 sm:px-6">
          <h2 className="mb-3 text-[10px] font-bold uppercase tracking-wider text-zinc-600 sm:text-xs">
            Rented ({soldOut.length})
          </h2>
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide sm:gap-3" style={{ scrollbarWidth: 'none' }}>
            {soldOut.map((movie) => (
              <div key={movie.id} className="w-[80px] flex-shrink-0 sm:w-[100px]">
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
