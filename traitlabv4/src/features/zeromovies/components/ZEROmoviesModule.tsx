import { useState, useCallback, useRef, useEffect } from 'react';
import { Film, ChevronLeft, ChevronRight } from 'lucide-react';
import { useMoviesCatalog } from '../hooks/useMoviesCatalog';
import { useZeroBalance, useMoviesConfig } from '../hooks/useZeroBalance';
import { useMoviesStore } from '../store/moviesStore';
import { MovieCard } from './MovieCard';
import { MovieDetailModal } from './MovieDetailModal';
import { MintSuccessModal } from './MintSuccessModal';
import type { Movie } from '../types';

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
  const [containerWidth, setContainerWidth] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef(0);
  const touchDelta = useRef(0);
  const isDragging = useRef(false);

  useEffect(() => {
    const measure = () => {
      if (containerRef.current) setContainerWidth(containerRef.current.offsetWidth);
    };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, []);

  const goTo = useCallback((idx: number) => {
    setActiveIndex(Math.max(0, Math.min(movies.length - 1, idx)));
  }, [movies.length]);

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
    if (touchDelta.current > 35) goTo(activeIndex - 1);
    else if (touchDelta.current < -35) goTo(activeIndex + 1);
    touchDelta.current = 0;
  };
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
    if (touchDelta.current > 35) goTo(activeIndex - 1);
    else if (touchDelta.current < -35) goTo(activeIndex + 1);
    touchDelta.current = 0;
  };

  if (movies.length === 0) return null;

  // Responsive sizes
  const isMobile = containerWidth > 0 && containerWidth < 640;
  const centerSize = isMobile ? 200 : 220;
  const sideSize = isMobile ? 100 : 140;
  const gap = isMobile ? 70 : 120;
  const VISIBLE_SIDE = isMobile ? 3 : 4;
  const sliderHeight = centerSize + (isMobile ? 80 : 90);

  return (
    <div ref={containerRef} className="relative mx-auto w-full select-none overflow-hidden py-4 sm:py-8" style={{ perspective: '1000px' }}>
      {/* Arrows — desktop only */}
      <button
        onClick={() => goTo(activeIndex - 1)}
        disabled={activeIndex === 0}
        className="absolute left-2 top-1/2 z-30 hidden -translate-y-1/2 rounded-full bg-black/60 p-2 text-white hover:bg-red-600 disabled:opacity-20 sm:block"
      >
        <ChevronLeft className="h-5 w-5" />
      </button>
      <button
        onClick={() => goTo(activeIndex + 1)}
        disabled={activeIndex === movies.length - 1}
        className="absolute right-2 top-1/2 z-30 hidden -translate-y-1/2 rounded-full bg-black/60 p-2 text-white hover:bg-red-600 disabled:opacity-20 sm:block"
      >
        <ChevronRight className="h-5 w-5" />
      </button>

      {/* 3D Cards */}
      <div
        className="relative flex touch-pan-y items-center justify-center"
        style={{ height: `${sliderHeight}px` }}
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

          const translateX = offset * gap;
          const translateZ = isCenter ? 50 : -(absOffset * 40);
          const rotateY = isCenter ? 0 : offset * -35;
          const size = isCenter ? centerSize : Math.max(sideSize * 0.7, sideSize * (1 - absOffset * 0.15));
          const cardOpacity = isCenter ? 1 : Math.max(0.3, 1 - absOffset * 0.2);
          const zIndex = 20 - absOffset;

          return (
            <div
              key={movie.id}
              onClick={() => isCenter ? onSelect(movie.id) : goTo(idx)}
              className="absolute cursor-pointer"
              style={{
                transform: `translateX(${translateX}px) translateZ(${translateZ}px) rotateY(${rotateY}deg)`,
                opacity: cardOpacity,
                zIndex,
                width: `${size}px`,
                transition: 'all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                transformStyle: 'preserve-3d',
              }}
            >
              <div className={`overflow-hidden rounded-lg border ${
                isCenter
                  ? 'border-red-600/50 shadow-[0_0_30px_rgba(220,38,38,0.25)]'
                  : 'border-zinc-800/30'
              }`}>
                {/* Image */}
                <div className="relative aspect-square w-full bg-zinc-900">
                  {mystery ? (
                    <div className="flex h-full w-full items-center justify-center bg-zinc-950">
                      <div className="flex flex-col items-center">
                        <span className={`font-black italic text-red-600 ${isCenter ? 'text-6xl' : 'text-3xl'}`}>X</span>
                        <span className="mt-1 text-[6px] uppercase tracking-[0.2em] text-zinc-600">Restricted</span>
                      </div>
                    </div>
                  ) : (
                    <img
                      src={getPosterUrl(movie.id)}
                      alt={movie.name}
                      className={`h-full w-full object-contain ${
                        movie.minted ? 'opacity-20 saturate-0' : ''
                      }`}
                      style={{ imageRendering: 'pixelated' }}
                      draggable={false}
                    />
                  )}

                  {/* Rented badge */}
                  {movie.minted && !mystery && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="rounded bg-red-900/70 px-2 py-0.5 text-[7px] font-bold uppercase text-red-400">
                        Rented
                      </span>
                    </div>
                  )}
                </div>

                {/* Name — center card only */}
                {isCenter && (
                  <div className="bg-zinc-950/90 px-2 py-2 text-center">
                    <p className="truncate text-[10px] font-bold text-white sm:text-xs">
                      {mystery ? '???' : movie.name}
                    </p>
                    {!movie.minted && (
                      <p className="mt-0.5 text-[8px] text-red-400">Tap to mint</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Counter */}
      <div className="mt-2 text-center">
        <p className="text-[10px] tabular-nums text-zinc-500">
          {activeIndex + 1} / {movies.length}
        </p>
        <p className="mt-0.5 text-[8px] text-zinc-700 sm:hidden">Swipe to browse</p>
      </div>

      {/* Dots */}
      <div className="mt-2 flex justify-center gap-0.5">
        {movies.map((_, idx) => (
          <button
            key={idx}
            onClick={() => goTo(idx)}
            className={`h-1 rounded-full transition-all duration-300 ${
              idx === activeIndex ? 'w-3 bg-red-600' : 'w-1 bg-zinc-800 hover:bg-zinc-600'
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
      <div className="relative overflow-hidden border-b border-red-900/30 bg-gradient-to-b from-red-950/40 via-red-950/10 to-black px-4 py-6 sm:px-6 sm:py-10">
        <div className="mx-auto max-w-6xl text-center">
          <Film className="mx-auto mb-2 h-7 w-7 text-red-600 sm:mb-3 sm:h-10 sm:w-10" />
          <h1 className="mb-1 text-xl font-bold tracking-wider text-red-600 sm:text-3xl">
            AdrianZERO Movie
          </h1>
          <p className="mb-2 text-[10px] tracking-[0.3em] text-zinc-500 sm:mb-4 sm:text-xs">
            PART ONE
          </p>
          <p className="mx-auto mb-3 max-w-sm text-[10px] leading-relaxed text-zinc-400 sm:mb-6 sm:max-w-md sm:text-[11px]">
            Choose your movie. Mint with $ZERO.<br />
            Each movie is a unique 1/1 AdrianZERO NFT.
            <br />
            <span className="text-zinc-600">A four-piece trilogy.</span>
          </p>

          <div className="flex flex-wrap justify-center gap-3 text-[9px] uppercase tracking-wider text-zinc-500 sm:gap-4 sm:text-[10px]">
            <span>Minted: <span className="text-white">{totalMinted}/{movieCount}</span></span>
            <span>Price: <span className="text-red-400">{priceFormatted.toLocaleString()} $ZERO</span></span>
            <span>Balance: <span className="text-green-400">{balance.toLocaleString(undefined, { maximumFractionDigits: 0 })} $ZERO</span></span>
            {paused && <span className="animate-pulse text-yellow-400">COMING SOON</span>}
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
          <div className="py-20 text-center text-sm text-zinc-600">No movies available yet.</div>
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
          <div className="flex gap-2 overflow-x-auto pb-2 sm:gap-3" style={{ scrollbarWidth: 'none' }}>
            {soldOut.map((movie) => (
              <div key={movie.id} className="w-[70px] flex-shrink-0 sm:w-[100px]">
                <MovieCard movie={movie} posterUrl={getPosterUrl(movie.id)} onClick={() => selectMovie(movie.id)} />
              </div>
            ))}
          </div>
        </div>
      )}

      <MovieDetailModal
        movie={selectedMovie}
        posterUrl={selectedMovie && !selectedMystery ? getPosterUrl(selectedMovie.id) : ''}
        open={isDetailOpen}
        onClose={closeDetail}
        onMintSuccess={refetch}
        isMystery={selectedMystery}
      />
      <MintSuccessModal movieName={selectedMovie?.name || ''} />

      <style>{`.scrollbar-hide::-webkit-scrollbar { display: none; }`}</style>
    </div>
  );
}
