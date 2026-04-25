import type { Movie2, Movie2RentalState } from '../types';
import { useAccount } from 'wagmi';

interface Movie2CardProps {
  movie: Movie2;
  posterUrl: string;
  rental: Movie2RentalState;
  onClick: () => void;
}

const ZERO_ADDR = '0x0000000000000000000000000000000000000000';

const ANGLE_ACCENT: Record<Movie2['angle'], string> = {
  cult: 'border-amber-500/30',
  pixel: 'border-emerald-500/30',
  horror: 'border-fuchsia-700/30',
};

export function Movie2Card({ movie, posterUrl, rental, onClick }: Movie2CardProps) {
  const { address } = useAccount();

  const hasRenter = rental.renter && rental.renter !== ZERO_ADDR;
  const isMine = hasRenter && rental.renter.toLowerCase() === address?.toLowerCase();
  const isYoursPermanent = rental.permanent && isMine;
  const isYoursRental = !rental.permanent && isMine;
  const isOthers = (rental.permanent || hasRenter) && !isMine;

  return (
    <button
      onClick={onClick}
      className={`group relative flex min-w-0 flex-col overflow-hidden rounded transition-all duration-300 text-left
        ${isOthers ? 'cursor-pointer hover:opacity-90' : 'cursor-pointer hover:scale-105 hover:z-10'}
        ${isYoursPermanent ? 'border-2 border-yellow-400' : ''}
        ${isYoursRental && !rental.isOverdue ? 'border-2 border-sky-400' : ''}
        ${rental.isOverdue ? 'border-2 border-red-600' : ''}
        ${!isYoursPermanent && !isYoursRental && !rental.isOverdue ? `border ${ANGLE_ACCENT[movie.angle]}` : ''}
      `}
    >
      <div className="relative aspect-square w-full overflow-hidden rounded-t bg-zinc-900">
        {movie.isMystery ? (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-zinc-900 via-zinc-950 to-black">
            <span className="font-mono text-3xl font-bold text-zinc-700">???</span>
          </div>
        ) : (
          <img
            src={posterUrl}
            alt={movie.name}
            className={`h-full w-full object-contain ${isOthers && !rental.isOverdue ? 'opacity-20 saturate-0' : ''}`}
            style={{ imageRendering: 'pixelated' }}
            loading="lazy"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).style.display = 'none';
            }}
          />
        )}

        {/* OVERDUE overlay (any S2 NFT past gracePeriod) */}
        {rental.isOverdue && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-red-900/40">
            <span className="rotate-[-12deg] rounded border-2 border-red-500 px-2 py-0.5 text-[10px] font-black uppercase tracking-widest text-red-400">
              OVERDUE
            </span>
            <span className="mt-1 text-[8px] font-bold uppercase tracking-wider text-red-300">
              {rental.daysOverdue}d
            </span>
          </div>
        )}

        {/* Status badges */}
        {isYoursPermanent && !rental.isOverdue && (
          <div className="absolute top-1 right-1 rounded bg-yellow-400 px-1.5 py-0.5 text-[7px] font-bold text-black">OWNED</div>
        )}
        {isYoursRental && !rental.isOverdue && (
          <div className="absolute top-1 right-1 rounded bg-sky-400 px-1.5 py-0.5 text-[7px] font-bold text-black">RENTING</div>
        )}
        {isOthers && !rental.isOverdue && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="rounded bg-red-900/70 px-2 py-0.5 text-[8px] font-bold uppercase text-red-400">
              {rental.permanent ? 'Owned' : 'Rented'}
            </span>
          </div>
        )}
      </div>

      <div className="px-1 py-1.5">
        <p className={`truncate text-[9px] font-bold transition-colors ${
          rental.isOverdue ? 'text-red-400' : isOthers ? 'text-zinc-600' : 'text-zinc-300 group-hover:text-white'
        }`}>
          {movie.name}
        </p>
      </div>
    </button>
  );
}
