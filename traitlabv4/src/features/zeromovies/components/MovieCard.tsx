import type { Movie } from '../types';
import { useAccount } from 'wagmi';

interface MovieCardProps {
  movie: Movie;
  posterUrl: string;
  onClick: () => void;
  isCurrentlyRented?: boolean;
  isPermanent?: boolean;
  renterAddr?: string;
}

export function MovieCard({ movie, posterUrl, onClick, isCurrentlyRented, isPermanent, renterAddr }: MovieCardProps) {
  const { address } = useAccount();

  const isYoursRental = isCurrentlyRented && !isPermanent && renterAddr?.toLowerCase() === address?.toLowerCase();
  const isYoursPermanent = isPermanent && (
    renterAddr?.toLowerCase() === address?.toLowerCase() ||
    movie.mintedBy?.toLowerCase() === address?.toLowerCase()
  );
  const isYours = isYoursRental || isYoursPermanent;
  const isOthers = (isCurrentlyRented || isPermanent) && !isYours;

  return (
    <button
      onClick={onClick}
      className={`group relative flex flex-col rounded transition-all duration-300 text-left
        ${isOthers
          ? 'cursor-pointer hover:opacity-90'
          : 'cursor-pointer hover:scale-105 hover:z-10'
        }
        ${isYoursPermanent ? 'border-2 border-yellow-400' : ''}
        ${isYoursRental ? 'border-2 border-sky-400' : ''}
      `}
    >
      <div className="relative aspect-square w-full overflow-hidden rounded-t bg-zinc-900">
        <img
          src={posterUrl}
          alt={movie.name}
          className={`h-full w-full object-contain ${isOthers ? 'opacity-20 saturate-0' : ''}`}
          style={{ imageRendering: 'pixelated' }}
          loading="lazy"
        />

        {/* Badge */}
        {isYoursPermanent && (
          <div className="absolute top-1 right-1 rounded bg-yellow-400 px-1.5 py-0.5 text-[7px] font-bold text-black">
            OWNED
          </div>
        )}
        {isYoursRental && (
          <div className="absolute top-1 right-1 rounded bg-sky-400 px-1.5 py-0.5 text-[7px] font-bold text-black">
            RENTING
          </div>
        )}
        {isOthers && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="rounded bg-red-900/70 px-2 py-0.5 text-[8px] font-bold uppercase text-red-400">
              Rented
            </span>
          </div>
        )}
      </div>

      <div className="px-1 py-1.5">
        <p className={`truncate text-[9px] font-bold transition-colors ${
          isOthers ? 'text-zinc-600' : 'text-zinc-300 group-hover:text-white'
        }`}>
          {movie.name}
        </p>
      </div>
    </button>
  );
}
