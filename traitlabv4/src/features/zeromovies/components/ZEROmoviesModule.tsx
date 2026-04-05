import { useState, useCallback, useRef, useEffect } from 'react';
import { Film, ChevronLeft, ChevronRight } from 'lucide-react';
import { useMoviesCatalog } from '../hooks/useMoviesCatalog';
import { useZeroBalance, useMoviesConfig } from '../hooks/useZeroBalance';
import { useAllRentalStatus, usePendingRewards } from '../hooks/useRentalStatus';
import { useClaimMovieRewards } from '../hooks/useMovieMint';
import { useMoviesStore } from '../store/moviesStore';
import { MovieCard } from './MovieCard';
import { MovieDetailModal } from './MovieDetailModal';
import { MintSuccessModal } from './MintSuccessModal';
import { MarketplaceSection } from './MarketplaceSection';
import type { Movie } from '../types';

const MYSTERY_IDS = new Set([2, 5, 11, 12, 13, 18, 21, 26]);

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
  rentalStatusMap,
}: {
  movies: Movie[];
  onSelect: (id: number) => void;
  rentalStatusMap: Map<number, { renter: string; deposit: bigint; rentedAt: number; permanent: boolean; rentCount: number }>;
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

  // Wheel / trackpad scroll
  const wheelTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wheelAccum = useRef(0);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const onWheel = (e: WheelEvent) => {
      // Use deltaX for trackpad horizontal swipe, deltaY for mouse wheel
      const delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
      if (Math.abs(delta) < 2) return;

      e.preventDefault();
      wheelAccum.current += delta;

      if (wheelTimeout.current) clearTimeout(wheelTimeout.current);
      wheelTimeout.current = setTimeout(() => {
        if (wheelAccum.current > 30) goTo(activeIndex + 1);
        else if (wheelAccum.current < -30) goTo(activeIndex - 1);
        wheelAccum.current = 0;
      }, 80);
    };

    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [activeIndex, goTo]);

  // Keyboard arrows
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') goTo(activeIndex - 1);
      if (e.key === 'ArrowRight') goTo(activeIndex + 1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [activeIndex, goTo]);

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
          const rental = rentalStatusMap.get(movie.id);
          const isCurrentlyRented = rental?.renter != null && rental.renter !== '0x0000000000000000000000000000000000000000';
          const isPerm = rental?.permanent === true;
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
                        isCurrentlyRented || isPerm ? 'opacity-20 saturate-0' : ''
                      }`}
                      style={{ imageRendering: 'pixelated' }}
                      draggable={false}
                    />
                  )}

                  {/* Rented / Permanent badge */}
                  {isPerm && !mystery && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="rounded bg-yellow-900/70 px-2 py-0.5 text-[7px] font-bold uppercase text-yellow-400">
                        Kept Forever
                      </span>
                    </div>
                  )}
                  {isCurrentlyRented && !isPerm && !mystery && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="rounded bg-red-900/70 px-2 py-0.5 text-[7px] font-bold uppercase text-red-400">
                        Rented
                      </span>
                    </div>
                  )}
                </div>

                {/* Name + stats — center card only */}
                {isCenter && (
                  <div className="bg-zinc-950/90 px-2 py-2 text-center">
                    <p className="truncate text-[10px] font-bold text-white sm:text-xs">
                      {mystery ? '???' : movie.name}
                    </p>
                    {!isCurrentlyRented && !isPerm && (
                      <p className="mt-0.5 text-[8px] text-red-400">Tap to rent or buy</p>
                    )}
                    {rental && Number(rental.rentCount) > 0 && !mystery && (
                      <p className="mt-0.5 text-[7px] text-zinc-600">
                        {Number(rental.rentCount)}x rented
                        {isPerm && ' · Owned'}
                      </p>
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
  const { movies, isLoading, refetch } = useMoviesCatalog();
  const { balance } = useZeroBalance();
  const { priceFormatted, paused, movieCount } = useMoviesConfig();
  const { statusMap, refetch: refetchStatus } = useAllRentalStatus();
  const { pending: pendingRewards } = usePendingRewards();
  const { claim, isPending: isClaimPending } = useClaimMovieRewards();
  const { selectedMovieId, isDetailOpen, selectMovie, closeDetail } = useMoviesStore();

  const selectedMovie = movies.find((m) => m.id === selectedMovieId) || null;
  const selectedMystery = selectedMovie ? isMystery(selectedMovie.id, selectedMovie.minted) : false;
  const selectedRentalStatus = selectedMovie ? statusMap.get(selectedMovie.id) || null : null;

  const handleRefresh = () => { refetch(); refetchStatus(); };

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <div className="relative overflow-hidden border-b border-red-900/30 bg-gradient-to-b from-red-950/40 via-red-950/10 to-black px-4 py-6 sm:px-6 sm:py-10">
        <div className="mx-auto max-w-6xl text-center">
          <Film className="mx-auto mb-2 h-7 w-7 text-red-600 sm:mb-3 sm:h-10 sm:w-10" />
          <h1 className="mb-1 text-xl font-bold tracking-wider text-red-600 sm:text-3xl">
            ZEROmovies
          </h1>
          <p className="mb-2 text-[10px] tracking-[0.3em] text-zinc-500 sm:mb-4 sm:text-xs">
            PART ONE
          </p>
          <p className="mx-auto mb-3 max-w-sm text-[10px] leading-relaxed text-zinc-400 sm:mb-6 sm:max-w-md sm:text-[11px]">
            Choose your movie. Rent with $ZERO. Return anytime.<br />
            Each movie is a unique 1/1 AdrianZERO NFT.
            <br />
            <span className="text-zinc-600">A four-piece trilogy.</span>
          </p>

          {/* Rewards claim */}
          {pendingRewards > 0 && (
            <button
              onClick={() => claim()}
              disabled={isClaimPending}
              className="mx-auto mb-3 flex items-center gap-2 rounded-full border border-green-600/30 bg-green-900/20 px-4 py-1.5 text-[10px] font-bold text-green-400 hover:bg-green-900/40 transition-colors"
            >
              {isClaimPending ? 'Claiming...' : `Claim ${pendingRewards.toLocaleString(undefined, { maximumFractionDigits: 0 })} $ZERO rewards`}
            </button>
          )}

          <div className="flex flex-wrap justify-center gap-3 text-[9px] uppercase tracking-wider text-zinc-500 sm:gap-4 sm:text-[10px]">
            <span>Taken: <span className="text-white">{Array.from(statusMap.values()).filter(r => (r.renter && r.renter !== '0x0000000000000000000000000000000000000000') || r.permanent).length}/{movieCount}</span></span>
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
          <CoverflowSlider movies={movies} onSelect={selectMovie} rentalStatusMap={statusMap} />
        )}
      </div>

      {/* Rented/Permanent section */}
      {(() => {
        const rentedMovies = movies.filter((m) => {
          const r = statusMap.get(m.id);
          return (r?.renter && r.renter !== '0x0000000000000000000000000000000000000000') || r?.permanent;
        });
        if (rentedMovies.length === 0) return null;
        return (
          <div className="mx-auto max-w-6xl px-4 pb-10 sm:px-6">
            <h2 className="mb-4 text-[10px] font-bold uppercase tracking-wider text-zinc-600 sm:text-xs">
              Off the Shelf ({rentedMovies.length})
            </h2>
            <div className="grid grid-cols-4 gap-3 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8">
              {rentedMovies.map((movie) => {
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
                  />
                );
              })}
            </div>
          </div>
        );
      })()}

      {/* Marketplace */}
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
