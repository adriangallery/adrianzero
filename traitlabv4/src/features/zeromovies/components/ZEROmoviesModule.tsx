import { useRef } from 'react';
import { Film, ChevronLeft, ChevronRight } from 'lucide-react';
import { useMoviesCatalog } from '../hooks/useMoviesCatalog';
import { useZeroBalance, useMoviesConfig } from '../hooks/useZeroBalance';
import { useMoviesStore } from '../store/moviesStore';
import { MovieCard } from './MovieCard';
import { MovieDetailModal } from './MovieDetailModal';
import { MintSuccessModal } from './MintSuccessModal';

function getPosterUrl(movieId: number): string {
  return `/images/zeromovies/${movieId}.png`;
}

function CarouselRow({
  title,
  movies,
  onSelect,
}: {
  title: string;
  movies: { id: number; name: string; minted: boolean; active: boolean; tokenId: number; mintedBy: string }[];
  onSelect: (id: number) => void;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (dir: 'left' | 'right') => {
    if (!scrollRef.current) return;
    const amount = scrollRef.current.clientWidth * 0.7;
    scrollRef.current.scrollBy({ left: dir === 'left' ? -amount : amount, behavior: 'smooth' });
  };

  if (movies.length === 0) return null;

  return (
    <section className="mb-8">
      <h2 className="mb-3 px-6 text-xs font-bold uppercase tracking-wider text-zinc-400">
        {title}
      </h2>
      <div className="group/row relative">
        {/* Left Arrow */}
        <button
          onClick={() => scroll('left')}
          className="absolute left-0 top-0 z-10 hidden h-full w-10 items-center justify-center bg-gradient-to-r from-black/80 to-transparent transition-opacity group-hover/row:flex"
        >
          <ChevronLeft className="h-6 w-6 text-white" />
        </button>

        {/* Scrollable Row */}
        <div
          ref={scrollRef}
          className="flex gap-3 overflow-x-auto px-6 pb-4 scrollbar-hide"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {movies.map((movie) => (
            <MovieCard
              key={movie.id}
              movie={movie}
              posterUrl={getPosterUrl(movie.id)}
              onClick={() => onSelect(movie.id)}
            />
          ))}
        </div>

        {/* Right Arrow */}
        <button
          onClick={() => scroll('right')}
          className="absolute right-0 top-0 z-10 hidden h-full w-10 items-center justify-center bg-gradient-to-l from-black/80 to-transparent transition-opacity group-hover/row:flex"
        >
          <ChevronRight className="h-6 w-6 text-white" />
        </button>
      </div>
    </section>
  );
}

export function ZEROmoviesModule() {
  const { movies, available, soldOut, isLoading, refetch } = useMoviesCatalog();
  const { balance } = useZeroBalance();
  const { priceFormatted, paused, totalMinted, movieCount } = useMoviesConfig();
  const { selectedMovieId, isDetailOpen, selectMovie, closeDetail } = useMoviesStore();

  const selectedMovie = movies.find((m) => m.id === selectedMovieId) || null;

  // Split available into genre rows for Netflix feel
  const sciFi = available.filter((m) => [5, 6, 11, 13, 15, 16, 17, 18, 24].includes(m.id));
  const comedy = available.filter((m) => [3, 4, 7, 8, 9, 10, 12, 21, 23, 25].includes(m.id));
  const action = available.filter((m) => [1, 2, 14, 19, 20, 22, 26].includes(m.id));

  return (
    <div className="min-h-screen bg-black">
      {/* Header — Netflix red banner */}
      <div className="relative overflow-hidden border-b border-red-900/30 bg-gradient-to-b from-red-950/40 via-red-950/20 to-black px-6 py-8">
        <div className="mx-auto max-w-6xl">
          <div className="mb-3 flex items-center gap-3">
            <Film className="h-8 w-8 text-red-600" />
            <h1 className="text-2xl font-bold tracking-wider text-red-600">
              ZEROmovies
            </h1>
          </div>

          <p className="mb-4 max-w-lg text-xs leading-relaxed text-zinc-400">
            Choose your movie. Mint with $ZERO. Each movie is a unique 1/1 AdrianZERO NFT.
          </p>

          <div className="flex flex-wrap gap-4 text-[10px] uppercase tracking-wider text-zinc-500">
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

      {/* Carousel Content */}
      <div className="mx-auto max-w-6xl py-6">
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
            {/* Genre Rows — Netflix style */}
            <CarouselRow title="Sci-Fi & Thriller" movies={sciFi} onSelect={selectMovie} />
            <CarouselRow title="Comedy & Animation" movies={comedy} onSelect={selectMovie} />
            <CarouselRow title="Action & Drama" movies={action} onSelect={selectMovie} />

            {/* Rented */}
            <CarouselRow title="Rented" movies={soldOut} onSelect={selectMovie} />
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
      <MintSuccessModal movieName={selectedMovie?.name || ''} />

      {/* Hide scrollbar globally for this page */}
      <style>{`
        .scrollbar-hide::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  );
}
