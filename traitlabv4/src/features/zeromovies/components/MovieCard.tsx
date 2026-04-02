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
      className={`group relative flex-shrink-0 w-[140px] sm:w-[160px] md:w-[180px] flex flex-col overflow-hidden rounded transition-all duration-300 text-left
        ${movie.minted && !isYours
          ? 'cursor-pointer opacity-50 grayscale hover:opacity-70 hover:grayscale-0'
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
          className="h-full w-full object-contain"
          style={{ imageRendering: 'pixelated' }}
          loading="lazy"
        />

        {/* Sold Out Overlay */}
        {movie.minted && !isYours && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
            <span className="rotate-[-15deg] border border-red-600 px-2 py-1 text-[8px] font-bold text-red-500">
              SOLD OUT
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
        <p className="truncate text-[9px] font-bold text-zinc-300 group-hover:text-white transition-colors">
          {movie.name}
        </p>
      </div>
    </button>
  );
}
