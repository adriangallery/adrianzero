import type { Movie } from '../types';
import { useAccount } from 'wagmi';

interface MovieCardProps {
  movie: Movie;
  posterUrl: string;
  onClick: () => void;
  isCurrentlyRented?: boolean;
  isPermanent?: boolean;
  renterAddr?: string;
  listingPrice?: number;
  /** True when block.timestamp > rentedAt + gracePeriod (5d on S1). */
  isOverdue?: boolean;
  daysOverdue?: number;
}

export function MovieCard({
  movie,
  posterUrl,
  onClick,
  isCurrentlyRented,
  isPermanent,
  renterAddr,
  listingPrice,
  isOverdue = false,
  daysOverdue = 0,
}: MovieCardProps) {
  const { address } = useAccount();

  const ZERO_ADDR = '0x0000000000000000000000000000000000000000';
  const hasRenter = renterAddr && renterAddr !== ZERO_ADDR;
  const isYoursRental = isCurrentlyRented && !isPermanent && hasRenter && renterAddr?.toLowerCase() === address?.toLowerCase();
  const isYoursPermanent = isPermanent && (
    (hasRenter && renterAddr?.toLowerCase() === address?.toLowerCase()) ||
    (!hasRenter && movie.mintedBy?.toLowerCase() === address?.toLowerCase())
  );
  const isYours = isYoursRental || isYoursPermanent;
  // Split "others" by permanence so the grid distinguishes "rented by other"
  // (will come back to the shelf) from "owned by other" (gone forever).
  const isOthersPermanent = !!isPermanent && !isYoursPermanent;
  const isOthersRented = !!isCurrentlyRented && !isPermanent && !!hasRenter && !isYoursRental;
  const isOthers = isOthersPermanent || isOthersRented;
  const isOnSale = (listingPrice ?? 0) > 0 && !isYours;

  // Overdue routing: mine = action needed (loud); others = passive info (muted).
  const isMineOverdue = isOverdue && isYoursRental;
  const isOthersOverdue = isOverdue && !isYoursRental;

  return (
    <button
      onClick={onClick}
      className={`group relative flex min-w-0 flex-col overflow-hidden rounded transition-all duration-300 text-left
        ${isOthers ? 'cursor-pointer hover:opacity-90' : 'cursor-pointer hover:scale-105 hover:z-10'}
        ${isYoursPermanent ? 'border-2 border-yellow-400' : ''}
        ${isYoursRental && !isOverdue ? 'border-2 border-sky-400' : ''}
        ${isMineOverdue ? 'border-2 border-red-500 ring-2 ring-red-500/40' : ''}
        ${isOthersOverdue ? 'border border-red-900/60' : ''}
      `}
    >
      <div className="relative aspect-square w-full overflow-hidden rounded-t bg-zinc-900">
        <img
          src={posterUrl}
          alt={movie.name}
          className={`h-full w-full object-contain ${
            (isOthersRented || isOthersPermanent) && !isOnSale && !isOverdue
              ? 'opacity-20 saturate-0'
              : isOthersOverdue
                ? 'opacity-30 saturate-50'
                : ''
          }`}
          style={{ imageRendering: 'pixelated' }}
          loading="lazy"
        />

        {/* MINE OVERDUE — loud, action-needed overlay */}
        {isMineOverdue && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-red-900/55">
            <span className="rotate-[-12deg] rounded border-2 border-red-400 bg-red-950/40 px-2 py-0.5 text-[11px] font-black uppercase tracking-widest text-red-200 shadow-lg shadow-red-500/40">
              OVERDUE
            </span>
            <span className="mt-1 text-[9px] font-bold uppercase tracking-wider text-red-200">
              {daysOverdue}d
            </span>
            <span className="mt-1 rounded bg-yellow-400 px-1.5 py-0.5 text-[7px] font-bold uppercase text-black">
              Yours · pay or return
            </span>
          </div>
        )}

        {/* OTHERS OVERDUE — muted, info-only (no action available to viewer) */}
        {isOthersOverdue && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-red-950/20">
            <span className="rotate-[-10deg] rounded border border-red-900 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-widest text-red-700/80">
              Overdue
            </span>
            <span className="mt-0.5 text-[7px] font-bold uppercase tracking-wider text-red-700/70">
              {daysOverdue}d
            </span>
          </div>
        )}

        {/* Status badges (only when not overdue) */}
        {!isOverdue && isYoursPermanent && (
          <div className="absolute top-1 right-1 rounded bg-yellow-400 px-1.5 py-0.5 text-[7px] font-bold text-black">
            OWNED
          </div>
        )}
        {!isOverdue && isYoursRental && (
          <div className="absolute top-1 right-1 rounded bg-sky-400 px-1.5 py-0.5 text-[7px] font-bold text-black">
            RENTING
          </div>
        )}
        {!isOverdue && isOnSale && (
          <div className="absolute bottom-1 left-1 rounded bg-green-600 px-1.5 py-0.5 text-[7px] font-bold text-white">
            ON SALE
          </div>
        )}
        {/* Others rented (in grace) → can come back, amber tag */}
        {!isOverdue && isOthersRented && !isOnSale && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="rounded bg-amber-900/70 px-2 py-0.5 text-[8px] font-bold uppercase tracking-wider text-amber-300">
              Rented
            </span>
          </div>
        )}
        {/* Others permanent (gone forever) → distinct slate tag */}
        {!isOverdue && isOthersPermanent && !isOnSale && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="rounded bg-zinc-800/85 px-2 py-0.5 text-[8px] font-bold uppercase tracking-wider text-zinc-400">
              Taken
            </span>
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
