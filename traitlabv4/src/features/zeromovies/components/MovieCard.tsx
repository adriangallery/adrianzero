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

  return (
    <button
      onClick={onClick}
      disabled={movie.minted && !isYours}
      className={`group relative flex flex-col overflow-hidden rounded-lg transition-all duration-300 text-left
        ${movie.minted && !isYours
          ? 'cursor-not-allowed opacity-60 grayscale'
          : 'cursor-pointer hover:scale-105 hover:shadow-[0_0_20px_rgba(220,38,38,0.4)]'
        }
        ${isYours ? 'ring-2 ring-yellow-400' : ''}
      `}
    >
      {/* Poster Image */}
      <div className="relative aspect-[2/3] w-full overflow-hidden bg-zinc-900">
        <img
          src={posterUrl}
          alt={movie.name}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
          loading="lazy"
        />

        {/* Sold Out Overlay */}
        {movie.minted && !isYours && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/60">
            <span className="rotate-[-15deg] border-2 border-red-600 px-4 py-2 text-sm font-bold text-red-600">
              SOLD OUT
            </span>
          </div>
        )}

        {/* Yours Badge */}
        {isYours && (
          <div className="absolute top-2 right-2 rounded bg-yellow-400 px-2 py-1 text-[10px] font-bold text-black">
            YOURS
          </div>
        )}
      </div>

      {/* Movie Name */}
      <div className="bg-zinc-900/80 px-3 py-2">
        <p className="truncate text-xs font-bold text-white">{movie.name}</p>
      </div>
    </button>
  );
}
