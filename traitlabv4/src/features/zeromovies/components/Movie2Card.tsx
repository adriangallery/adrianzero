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
  // Split "others" by permanence so the grid distinguishes "rented by other"
  // (will return to the shelf) from "owned by other" (gone forever).
  const isOthersPermanent = rental.permanent && !isMine;
  const isOthersRented = !rental.permanent && !!hasRenter && !isMine;
  const isOthers = isOthersPermanent || isOthersRented;
  const isOverdue = rental.isOverdue;
  // Overdue routing: mine = action needed (loud); others = passive info (muted).
  const isMineOverdue = isOverdue && isYoursRental;
  const isOthersOverdue = isOverdue && !isYoursRental;
  // Pre-launch reservations for Movie #42 (auction) and #28 (Budokai prize).
  // Once `adminMintMovie2` lands the movie becomes `permanentlyOwned` and the
  // standard "Taken / Owned by you" branches above take precedence.
  const isReservedAuction = movie.reservedFor === 'auction' && !rental.permanent && !hasRenter;
  const isReservedBudokai = movie.reservedFor === 'budokai' && !rental.permanent && !hasRenter;

  return (
    <button
      onClick={onClick}
      className={`group relative flex min-w-0 flex-col overflow-hidden rounded transition-all duration-300 text-left
        ${isOthers ? 'cursor-pointer hover:opacity-90' : 'cursor-pointer hover:scale-105 hover:z-10'}
        ${isYoursPermanent ? 'border-2 border-yellow-400' : ''}
        ${isYoursRental && !isOverdue ? 'border-2 border-sky-400' : ''}
        ${isMineOverdue ? 'border-2 border-red-500 ring-2 ring-red-500/40' : ''}
        ${isOthersOverdue ? 'border border-red-900/60' : ''}
        ${isReservedAuction ? 'border-2 border-purple-500 ring-2 ring-purple-500/30' : ''}
        ${isReservedBudokai ? 'border-2 border-amber-500 ring-2 ring-amber-500/30' : ''}
        ${!isYoursPermanent && !isYoursRental && !isOverdue && !isReservedAuction && !isReservedBudokai ? `border ${ANGLE_ACCENT[movie.angle]}` : ''}
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
            className={`h-full w-full object-contain ${
              (isOthersRented || isOthersPermanent) && !isOverdue
                ? 'opacity-20 saturate-0'
                : isOthersOverdue
                  ? 'opacity-30 saturate-50'
                  : ''
            }`}
            style={{ imageRendering: 'pixelated' }}
            loading="lazy"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).style.display = 'none';
            }}
          />
        )}

        {/* MINE OVERDUE — loud, action needed */}
        {isMineOverdue && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-red-900/55">
            <span className="rotate-[-12deg] rounded border-2 border-red-400 bg-red-950/40 px-2 py-0.5 text-[11px] font-black uppercase tracking-widest text-red-200 shadow-lg shadow-red-500/40">
              OVERDUE
            </span>
            <span className="mt-1 text-[9px] font-bold uppercase tracking-wider text-red-200">
              {rental.daysOverdue}d
            </span>
            <span className="mt-1 rounded bg-yellow-400 px-1.5 py-0.5 text-[7px] font-bold uppercase text-black">
              Yours · pay or return
            </span>
          </div>
        )}

        {/* OTHERS OVERDUE — muted, info only */}
        {isOthersOverdue && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-red-950/20">
            <span className="rotate-[-10deg] rounded border border-red-900 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-widest text-red-700/80">
              Overdue
            </span>
            <span className="mt-0.5 text-[7px] font-bold uppercase tracking-wider text-red-700/70">
              {rental.daysOverdue}d
            </span>
          </div>
        )}

        {/* Status badges (only when not overdue) */}
        {isYoursPermanent && !isOverdue && (
          <div className="absolute top-1 right-1 rounded bg-yellow-400 px-1.5 py-0.5 text-[7px] font-bold text-black">OWNED</div>
        )}
        {isYoursRental && !isOverdue && (
          <div className="absolute top-1 right-1 rounded bg-sky-400 px-1.5 py-0.5 text-[7px] font-bold text-black">RENTING</div>
        )}
        {/* Others rented (in grace) → amber, will return to shelf */}
        {isOthersRented && !isOverdue && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="rounded bg-amber-900/70 px-2 py-0.5 text-[8px] font-bold uppercase tracking-wider text-amber-300">
              Rented
            </span>
          </div>
        )}
        {/* Others permanent (gone forever) → slate */}
        {isOthersPermanent && !isOverdue && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="rounded bg-zinc-800/85 px-2 py-0.5 text-[8px] font-bold uppercase tracking-wider text-zinc-400">
              Taken
            </span>
          </div>
        )}
        {/* Pre-launch reservations — auction (purple) and Budokai (amber) */}
        {isReservedAuction && (
          <div className="absolute inset-0 flex flex-col items-center justify-end gap-0.5 bg-gradient-to-t from-purple-950/85 via-purple-950/35 to-transparent pb-1.5">
            <span className="rounded bg-purple-500 px-1.5 py-0.5 text-[7px] font-bold uppercase tracking-wider text-black">
              Auction
            </span>
          </div>
        )}
        {isReservedBudokai && (
          <div className="absolute inset-0 flex flex-col items-center justify-end gap-0.5 bg-gradient-to-t from-amber-950/85 via-amber-950/35 to-transparent pb-1.5">
            <span className="rounded bg-amber-500 px-1.5 py-0.5 text-[7px] font-bold uppercase tracking-wider text-black">
              Budokai Prize
            </span>
          </div>
        )}
        {/* Animated movie indicator — small badge in corner */}
        {movie.hasAnimation && !isReservedAuction && !isReservedBudokai && (
          <div className="absolute top-1 left-1 rounded bg-purple-500/80 px-1 py-0.5 text-[6px] font-bold uppercase tracking-wider text-white">
            GIF
          </div>
        )}
      </div>

      <div className="px-1 py-1.5">
        <p className={`truncate text-[9px] font-bold transition-colors ${
          isMineOverdue
            ? 'text-red-300'
            : isOthersOverdue
              ? 'text-red-700/80'
              : isOthers
                ? 'text-zinc-600'
                : 'text-zinc-300 group-hover:text-white'
        }`}>
          {movie.name}
        </p>
      </div>
    </button>
  );
}
