import type { Movie } from '../types';
import { useAccount } from 'wagmi';

interface MovieCardProps {
  movie: Movie;
  posterUrl: string;
  onClick: () => void;
}

export function MovieCard({ movie, posterUrl, onClick }: MovieCardProps) {
  const { address } = useAccount();
  const isYours = movie.minted && movie.mintedBy?.toLowerCase() === address?.toLowerCase();
  const isRented = movie.minted && !isYours;

  return (
    <button
      onClick={onClick}
      className={`group relative flex-shrink-0 w-[140px] sm:w-[160px] md:w-[180px] flex flex-col overflow-hidden rounded transition-all duration-300 text-left
        ${isRented
          ? 'cursor-pointer hover:opacity-90'
          : 'cursor-pointer hover:scale-110 hover:z-10 hover:shadow-[0_0_30px_rgba(220,38,38,0.5)]'
        }
        ${isYours ? 'ring-2 ring-yellow-400 scale-105' : ''}
      `}
    >
      {/* Poster Image */}
      <div className="relative aspect-square w-full overflow-hidden bg-zinc-900">
        <img
          src={posterUrl}
          alt={movie.name}
          className={`h-full w-full object-contain ${isRented ? 'opacity-20 saturate-0' : ''}`}
          style={{ imageRendering: 'pixelated' }}
          loading="lazy"
        />

        {/* Rented overlay */}
        {isRented && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="rounded bg-red-900/70 px-2 py-0.5 text-[8px] font-bold uppercase tracking-wider text-red-400">
              Rented
            </span>
          </div>
        )}

        {/* Yours Badge */}
        {isYours && (
          <div className="absolute top-1 right-1 rounded bg-yellow-400 px-1.5 py-0.5 text-[7px] font-bold text-black">
            YOURS
          </div>
        )}
      </div>

      {/* Movie Name */}
      <div className="px-1 py-1.5">
        <p className={`truncate text-[9px] font-bold transition-colors ${
          isRented ? 'text-zinc-600' : 'text-zinc-300 group-hover:text-white'
        }`}>
          {movie.name}
        </p>
      </div>
    </button>
  );
}
